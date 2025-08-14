from flask import Flask, jsonify, request, render_template, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
import data_manager
import os

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = os.urandom(24)

# --- Authentication Setup ---
# In a real app, this would be loaded from a secure config file or environment variable.
ADMIN_PASSWORD_HASH = generate_password_hash('12345678')


# --- API Endpoints (Protected) ---
@app.route('/api/errors', methods=['GET'])
def get_errors():
    errors = data_manager.get_all_errors()
    return jsonify(errors)

@app.route('/api/errors', methods=['POST'])
def add_error_route():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    error_data = request.json
    if not error_data or not all(key in error_data for key in data_manager.FIELDNAMES):
        return jsonify({'error': 'Invalid or missing data'}), 400
    existing_errors = data_manager.get_all_errors()
    if any(e['Code'] == error_data['Code'] for e in existing_errors):
        return jsonify({'error': f"Error code {error_data['Code']} already exists."}), 409
    data_manager.add_error(error_data)
    return jsonify({'success': True, 'message': 'Error added successfully.'}), 201

@app.route('/api/errors/<code>', methods=['PUT'])
def update_error_route(code):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    updated_data = request.json
    if not updated_data or not all(key in updated_data for key in data_manager.FIELDNAMES):
        return jsonify({'error': 'Invalid or missing data'}), 400
    if data_manager.update_error(code, updated_data):
        return jsonify({'success': True, 'message': f'Error {code} updated successfully.'})
    else:
        return jsonify({'error': f'Error code {code} not found.'}), 404

@app.route('/api/errors/<code>', methods=['DELETE'])
def delete_error_route(code):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    if data_manager.delete_error(code):
        return jsonify({'success': True, 'message': f'Error {code} deleted successfully.'})
    else:
        return jsonify({'error': f'Error code {code} not found.'}), 404


# --- Frontend Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password and check_password_hash(ADMIN_PASSWORD_HASH, password):
            session['logged_in'] = True
            return redirect(url_for('admin'))
        else:
            flash('Invalid password provided', 'error')
    return render_template('login.html')

@app.route('/admin')
def admin():
    if 'logged_in' not in session:
        flash('Please log in to access this page.', 'info')
        return redirect(url_for('login'))
    return render_template('admin.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You have been successfully logged out.', 'success')
    return redirect(url_for('login'))


if __name__ == '__main__':
    app.run(debug=True, port=5001)
