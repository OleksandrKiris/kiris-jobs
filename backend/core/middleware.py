"""Bounded guards for the local, single-process API scaffold."""
import io
import json
import logging
import math
import re
import threading
import time
import uuid

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, SuspiciousOperation
from django.http import UnreadablePostError

from .protocol import API_VERSION
from .views import api_error

logger = logging.getLogger('core.requests')
ROUTES = {'/api/v1/health/': 'health', '/api/v1/version/': 'version',
          '/api/v1/materials/': 'materials', '/api/v1/capabilities/': 'capabilities'}
METHODS = {'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE'}


def log_route(path):
    # Classify before URL resolution as body/rate/host guards run first. Return
    # only a fixed template, including for malformed dynamic-path variants.
    if path.startswith('/api/v1/materials/') and path != '/api/v1/materials/':
        return '/api/v1/materials/{material_id}/'
    return ROUTES.get(path, 'unknown')


class APIGuardMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.limit = settings.CORE_MAX_CONTENT_LENGTH
        self.rate = settings.CORE_RATE_LIMIT_PER_MINUTE
        if any(type(value) is not int or value <= 0 for value in (self.limit, self.rate)):
            raise ImproperlyConfigured('Core request limits must be positive integers.')
        self.lock = threading.Lock()
        self.window = None
        self.count = 0

    def retry_after(self, now):
        # One bounded counter shared by all local clients; no IPs or user keys.
        with self.lock:
            if self.window is None or now - self.window >= 60:
                self.window, self.count = now, 0
            if self.count >= self.rate:
                return max(1, math.ceil(60 - (now - self.window)))
            self.count += 1
        return None

    def check_body(self, request):
        length = request.META.get('CONTENT_LENGTH', '')
        if length:
            if not isinstance(length, str) or not re.fullmatch(r'[0-9]{1,20}', length):
                return api_error('invalid_request', 'Invalid request framing.', status=400)
            if int(length) > self.limit:
                return api_error('payload_too_large', 'Request body is too large.', status=413)
        try:
            body = request.read(self.limit + 1)
        except (OSError, UnreadablePostError, SuspiciousOperation):
            return api_error('invalid_request', 'The request could not be read.', status=400)
        if len(body) > self.limit:
            return api_error('payload_too_large', 'Request body is too large.', status=413)
        # Preserve the bounded body for later Django parsing and view access.
        request._body = body
        request._stream = io.BytesIO(body)
        return None

    def __call__(self, request):
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        start = time.monotonic()
        request_id = uuid.uuid4().hex
        request.core_request_id = request_id
        retry = self.retry_after(start)
        if retry is not None:
            response = api_error('rate_limited', 'Too many requests. Try again later.', status=429)
            response['Retry-After'] = str(retry)
        else:
            try:
                request.get_host()
            except SuspiciousOperation:
                response = api_error('invalid_request', 'Invalid request host.', status=400)
            else:
                response = self.check_body(request)
                if response is None:
                    response = self.get_response(request)
        response['X-API-Version'] = API_VERSION
        response['X-Request-ID'] = request_id
        response['Cache-Control'] = 'no-store'
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['Referrer-Policy'] = 'no-referrer'
        logger.info(json.dumps({
            'api_version': API_VERSION, 'request_id': request_id,
            'method': request.method if request.method in METHODS else 'OTHER',
            'route': log_route(request.path),
            'status': response.status_code,
            'duration_ms': max(0, round((time.monotonic() - start) * 1000)),
        }, separators=(',', ':')))
        return response
