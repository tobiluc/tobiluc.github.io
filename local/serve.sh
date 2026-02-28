#!/bin/bash

PORT=8000
ROOT_DIR="$(dirname "$0")/.."

echo "Serving $ROOT_DIR on http://localhost:$PORT"
python3 -m http.server $PORT --directory "$ROOT_DIR"