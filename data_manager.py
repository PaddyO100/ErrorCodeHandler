import csv
import os

CSV_FILE = 'error_codes.csv'
# It's important that the fieldnames match the CSV headers exactly.
FIELDNAMES = ['Code', 'HMI Message', 'Cause', 'Action', 'Platforms']

def get_all_errors():
    """Reads all error codes from the CSV file."""
    if not os.path.exists(CSV_FILE):
        return []

    errors = []
    with open(CSV_FILE, mode='r', encoding='utf-8') as csvfile:
        # Using DictReader to make data handling easier
        reader = csv.DictReader(csvfile, delimiter=';')
        for row in reader:
            errors.append(row)
    return errors

def write_errors(errors):
    """Writes a list of errors to the CSV file, overwriting the existing file."""
    with open(CSV_FILE, mode='w', encoding='utf-8', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES, delimiter=';')
        writer.writeheader()
        writer.writerows(errors)

def add_error(error_data):
    """Adds a new error to the CSV file."""
    errors = get_all_errors()
    errors.append(error_data)
    write_errors(errors)

def update_error(code, updated_data):
    """Updates an existing error in the CSV file."""
    errors = get_all_errors()
    updated = False
    for i, error in enumerate(errors):
        if error['Code'] == code:
            errors[i] = updated_data
            updated = True
            break
    if updated:
        write_errors(errors)
    return updated

def delete_error(code):
    """Deletes an error from the CSV file."""
    errors = get_all_errors()
    original_length = len(errors)
    errors = [error for error in errors if error['Code'] != code]

    if len(errors) < original_length:
        write_errors(errors)
        return True
    return False
