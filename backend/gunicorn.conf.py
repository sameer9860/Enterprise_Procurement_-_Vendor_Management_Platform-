import multiprocessing
import os

# Render sets PORT automatically
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
backlog = 2048

# Free tier has 512MB RAM — keep workers low
workers = 2
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5

accesslog = '-'
errorlog = '-'
loglevel = 'info'

proc_name = 'procurement_platform'
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
