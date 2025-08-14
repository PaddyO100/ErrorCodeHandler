document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('error-form');
    const formTitle = document.getElementById('form-title');
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const formCancelBtn = document.getElementById('form-cancel-btn');
    const tableBody = document.getElementById('errors-table-body');
    const editCodeField = document.getElementById('edit-code');
    const codeInput = document.getElementById('code');

    const API_URL = '/api/errors';

    let allErrors = []; // Cache for all errors to find data for editing

    const fetchErrors = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch errors');
            allErrors = await response.json();
            renderTable(allErrors);
        } catch (error) {
            console.error('Error fetching errors:', error);
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-red-500">Fehler beim Laden der Daten.</td></tr>`;
        }
    };

    const renderTable = (errors) => {
        tableBody.innerHTML = '';
        if (errors.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4">Keine Fehlercodes gefunden.</td></tr>`;
            return;
        }
        // Sort errors by code number
        errors.sort((a, b) => parseInt(a.Code, 10) - parseInt(b.Code, 10));

        errors.forEach(error => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-700 hover:bg-gray-700/50';
            row.innerHTML = `
                <td class="p-3 align-top">${error.Code}</td>
                <td class="p-3 align-top">${error['HMI Message']}</td>
                <td class="p-3 align-top">${error.Platforms}</td>
                <td class="p-3 align-top">
                    <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm" data-code="${error.Code}">Bearbeiten</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg ml-2 text-sm" data-code="${error.Code}">Löschen</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    const resetForm = () => {
        form.reset();
        editCodeField.value = '';
        formTitle.textContent = 'Neuen Fehlercode hinzufügen';
        formSubmitBtn.textContent = 'Hinzufügen';
        formCancelBtn.style.display = 'none';
        codeInput.disabled = false;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const isEditing = !!editCodeField.value;

        // Ensure the 'Code' from the disabled field is included when editing
        if (isEditing) {
            data.Code = editCodeField.value;
        }

        const url = isEditing ? `${API_URL}/${data.Code}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'add'} error`);
            }

            resetForm();
            fetchErrors(); // Refresh table
        } catch (error) {
            console.error(`Error submitting form:`, error);
            alert(`Ein Fehler ist aufgetreten: ${error.message}`);
        }
    };

    const handleTableClick = (e) => {
        const target = e.target;
        const code = target.dataset.code;

        if (target.textContent === 'Bearbeiten') {
            const fullError = allErrors.find(err => err.Code === code);
            if (fullError) {
                form.elements['Code'].value = fullError.Code;
                form.elements['HMI Message'].value = fullError['HMI Message'];
                form.elements['Cause'].value = fullError.Cause;
                form.elements['Action'].value = fullError.Action;
                form.elements['Platforms'].value = fullError.Platforms;

                editCodeField.value = fullError.Code;
                formTitle.textContent = `Fehlercode ${fullError.Code} bearbeiten`;
                formSubmitBtn.textContent = 'Aktualisieren';
                formCancelBtn.style.display = 'inline-block';
                codeInput.disabled = true;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else if (target.textContent === 'Löschen') {
            if (confirm(`Sind Sie sicher, dass Sie den Fehlercode ${code} löschen möchten?`)) {
                fetch(`${API_URL}/${code}`, { method: 'DELETE' })
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to delete');
                        fetchErrors(); // Refresh table
                    })
                    .catch(error => {
                        console.error('Error deleting:', error);
                        alert('Fehler beim Löschen.');
                    });
            }
        }
    };

    // --- Event Listeners ---
    form.addEventListener('submit', handleFormSubmit);
    tableBody.addEventListener('click', handleTableClick);
    formCancelBtn.addEventListener('click', resetForm);

    // --- Initial Load ---
    fetchErrors();
});
