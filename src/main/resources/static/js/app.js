/*
  DueTracker Core Application Logic Engine
  Supports Centered Screen Positioning, Shop Owner Portal, Edit/Delete Customer & Remind Dues
*/

window.DueTrackerApp = {

  currentUser: null,
  activeTab: 'dashboard',
  currentTheme: localStorage.getItem('dt_theme') || 'dark',

  init() {
    console.log("DueTracker initialized.");
    this.applyTheme(this.currentTheme);

    const savedSession = sessionStorage.getItem('dt_active_session');

    if (savedSession) {
      try {
        this.currentUser = JSON.parse(savedSession);

        if (this.currentUser.role === 'SELLER') {
          this.loadSellerPortal();
          return;
        } else if (this.currentUser.role === 'CUSTOMER') {
          this.loadCustomerDashboard(this.currentUser.data.id);
          return;
        }

      } catch (e) {
        console.error("Session restore error:", e);
      }
    }

    this.navigateLanding();
  },

  togglePassword(inputId, btnEl) {
    const input = document.getElementById(inputId);

    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';

      if (btnEl) {
        btnEl.textContent = '🙈';
      }
    } else {
      input.type = 'password';

      if (btnEl) {
        btnEl.textContent = '👁';
      }
    }
  },

  toggleTheme() {
    this.currentTheme =
        this.currentTheme === 'dark' ? 'light' : 'dark';

    localStorage.setItem('dt_theme', this.currentTheme);
    this.applyTheme(this.currentTheme);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const label = document.getElementById('s-theme-label');

    if (label) {
      label.textContent =
          theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
  },

  showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });

    const view = document.getElementById(viewId);

    if (view) {
      view.classList.add('active');
    }

    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');

    if (
        viewId === 'view-seller-portal' ||
        viewId === 'view-customer-dashboard'
    ) {
      if (sidebar) sidebar.classList.add('visible');
      if (main) main.classList.add('with-sidebar');
    } else {
      if (sidebar) sidebar.classList.remove('visible');
      if (main) main.classList.remove('with-sidebar');
    }
  },

  navigateLanding() {
    this.currentUser = null;
    this.showView('view-landing');

    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');

    if (sidebar) sidebar.classList.remove('visible');
    if (main) main.classList.remove('with-sidebar');
  },

  goHome() {
    this.navigateLanding();
  },

  showSellerAuth(mode = 'login') {
    this.showView('view-seller-auth');
    this.toggleSellerAuthMode(mode);
  },

  toggleSellerAuthMode(mode = 'login') {
    const loginBox = document.getElementById('seller-login-card');
    const registerBox = document.getElementById('seller-register-card');

    if (!loginBox || !registerBox) return;

    if (mode === 'register') {
      loginBox.style.display = 'none';
      registerBox.style.display = 'block';
    } else {
      loginBox.style.display = 'block';
      registerBox.style.display = 'none';
    }
  },

  showCustomerAuth() {
    this.showView('view-customer-auth');
  },

  updateTopHeader(title = '') {
    const pageTitle = document.getElementById('page-title');
    const storeChip = document.getElementById('store-chip');

    if (pageTitle && title) {
      pageTitle.textContent = title;
    }

    if (
        storeChip &&
        this.currentUser &&
        this.currentUser.role === 'SELLER'
    ) {
      const seller = this.currentUser.data || {};

      storeChip.textContent =
          seller.storeName ||
          seller.store ||
          'DueTracker';
    }
  },

  getTabTitle(tabId) {
    const titles = {
      dashboard: 'Dashboard',
      customers: 'Customers',
      transactions: 'Transactions',
      settings: 'Settings'
    };

    return titles[tabId] || 'DueTracker';
  },

  logout() {
    sessionStorage.removeItem('dt_active_session');

    this.currentUser = null;
    this.activeTab = 'dashboard';

    this.showView('view-landing');
  },

  switchTab(tabId) {
    this.activeTab = tabId;

    document.querySelectorAll('.sb-link').forEach(link => {
      link.classList.remove('active');
    });

    const activeLink =
        document.querySelector(`.sb-link[data-tab="${tabId}"]`);

    if (activeLink) {
      activeLink.classList.add('active');
    }

    this.updateTopHeader(this.getTabTitle(tabId));

    if (tabId === 'dashboard') {
      this.refreshSellerDashboard();
    }

    if (tabId === 'customers') {
      this.loadCustomersTab();
    }

    if (tabId === 'transactions') {
      this.loadTransactionsTab();
    }

    if (tabId === 'settings') {
      this.loadSettingsTab();
    }
  },

  tab(tabId) {
    this.switchTab(tabId);
  },

  async handleSellerRegister(event) {
    if (event) {
      event.preventDefault();
    }

    const alertBox = document.getElementById('sr-alert');

    const name =
        document.getElementById('sr-name')?.value.trim();

    const store =
        document.getElementById('sr-store')?.value.trim();

    const email =
        document.getElementById('sr-email')?.value.trim();

    const phone =
        document.getElementById('sr-phone')?.value.trim();

    const password =
        document.getElementById('sr-pass')?.value;

    if (!name || !store || !email || !phone || !password) {
      this.showAlert(
          alertBox,
          'Please fill all required fields.',
          'error'
      );
      return;
    }

    try {
      const result =
          await DueTrackerAPI.registerSeller({
            name,
            storeName: store,
            email,
            phone,
            password
          });

      if (result.success === false) {
        throw new Error(
            result.message || 'Registration failed.'
        );
      }

      this.showAlert(
          alertBox,
          'Registration successful. Please login.',
          'success'
      );

      setTimeout(() => {
        this.toggleSellerAuthMode('login');

        const loginEmail =
            document.getElementById('sl-email');

        if (loginEmail) {
          loginEmail.value = email;
        }
      }, 1000);

    } catch (error) {
      console.error('Seller registration error:', error);

      this.showAlert(
          alertBox,
          error.message || 'Registration failed.',
          'error'
      );
    }
  },

  sellerRegister(event) {
    return this.handleSellerRegister(event);
  },

  async handleSellerLogin(event) {
    if (event) {
      event.preventDefault();
    }

    const alertBox =
        document.getElementById('sl-alert');

    const email =
        document.getElementById('sl-email')?.value.trim();

    const password =
        document.getElementById('sl-pass')?.value;

    if (!email || !password) {
      this.showAlert(
          alertBox,
          'Please enter email and password.',
          'error'
      );
      return;
    }

    try {
      const result =
          await DueTrackerAPI.loginSeller(
              email,
              password
          );

      if (!result || result.success === false) {
        throw new Error(
            result?.message || 'Invalid login credentials.'
        );
      }

      this.currentUser = {
        role: 'SELLER',
        data: result.data || result.seller || result
      };

      sessionStorage.setItem(
          'dt_active_session',
          JSON.stringify(this.currentUser)
      );

      await this.loadSellerPortal();

    } catch (error) {
      console.error('Seller login error:', error);

      this.showAlert(
          alertBox,
          error.message || 'Login failed.',
          'error'
      );
    }
  },

  sellerLogin(event) {
    return this.handleSellerLogin(event);
  },

  async handleCustomerLogin(event) {
    if (event) {
      event.preventDefault();
    }

    const alertBox =
        document.getElementById('cl-alert');

    const name =
        document.getElementById('cl-name')?.value.trim();

    const phone =
        document.getElementById('cl-phone')?.value.trim();

    if (!name || !phone) {
      this.showAlert(
          alertBox,
          'Please enter your name and phone number.',
          'error'
      );
      return;
    }

    try {
      const result =
          await DueTrackerAPI.loginCustomer(
              name,
              phone
          );

      if (!result || result.success === false) {
        throw new Error(
            result?.message || 'Customer not found.'
        );
      }

      this.currentUser = {
        role: 'CUSTOMER',
        data: result.data || result.customer || result
      };

      sessionStorage.setItem(
          'dt_active_session',
          JSON.stringify(this.currentUser)
      );

      await this.loadCustomerDashboard(
          this.currentUser.data.id
      );

    } catch (error) {
      console.error('Customer login error:', error);

      this.showAlert(
          alertBox,
          error.message || 'Login failed.',
          'error'
      );
    }
  },

  customerLogin(event) {
    return this.handleCustomerLogin(event);
  },

  async loadSellerPortal() {
    this.showView('view-seller-portal');

    this.updateTopHeader('Dashboard');

    const dashboardLink =
        document.querySelector(
            '.sb-link[data-tab="dashboard"]'
        );

    if (dashboardLink) {
      document.querySelectorAll('.sb-link')
          .forEach(link => link.classList.remove('active'));

      dashboardLink.classList.add('active');
    }

    await this.refreshSellerDashboard();
  },

  async refreshSellerPortal() {
    return this.refreshSellerDashboard();
  },

  async refreshSellerDashboard() {
    if (
        !this.currentUser ||
        this.currentUser.role !== 'SELLER'
    ) {
      return;
    }

    const sellerId =
        this.currentUser.data?.id;

    if (!sellerId) {
      console.error('Seller ID not found.');
      return;
    }

    try {
      const result =
          await DueTrackerAPI.getSellerDashboard(
              sellerId
          );

      const dashboard =
          result.data || result.dashboard || result;

      const totalCustomers =
          dashboard.totalCustomers ??
          dashboard.customerCount ??
          0;

      const totalPurchases =
          dashboard.totalPurchases ??
          dashboard.purchaseTotal ??
          0;

      const totalPayments =
          dashboard.totalPayments ??
          dashboard.paymentTotal ??
          0;

      const totalDue =
          dashboard.totalDue ??
          dashboard.dueAmount ??
          0;

      this.setText(
          'm-customers',
          totalCustomers
      );

      this.setText(
          'm-purchases',
          this.formatCurrency(totalPurchases)
      );

      this.setText(
          'm-payments',
          this.formatCurrency(totalPayments)
      );

      this.setText(
          'm-dues',
          this.formatCurrency(totalDue)
      );

      const customers =
          await DueTrackerAPI.getCustomers(sellerId);

      const customerList =
          customers.data ||
          customers.customers ||
          customers ||
          [];

      this.renderDashboardCustomers(
          customerList
      );

    } catch (error) {
      console.error(
          'Dashboard loading error:',
          error
      );
    }
  },

  renderDashboardCustomers(customers) {
    const table =
        document.getElementById('dash-table');

    if (!table) return;

    const tbody =
        table.querySelector('tbody') || table;

    tbody.innerHTML = '';

    if (!customers.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;">
            No customers found.
          </td>
        </tr>
      `;
      return;
    }

    customers.forEach(customer => {
      const due =
          Number(customer.dueAmount ?? customer.due ?? 0);

      const purchases =
          Number(
              customer.totalPurchases ??
              customer.purchases ??
              0
          );

      const payments =
          Number(
              customer.totalPayments ??
              customer.payments ??
              0
          );

      const tr =
          document.createElement('tr');

      tr.innerHTML = `
        <td>${this.escapeHtml(customer.name || '-')}</td>
        <td>${this.escapeHtml(customer.phone || '-')}</td>
        <td>${this.formatCurrency(purchases)}</td>
        <td>${this.formatCurrency(payments)}</td>
        <td>${this.formatCurrency(due)}</td>
        <td>
          <button
            class="btn small"
            onclick="App.openEditCustomerModal(${customer.id})">
            Edit
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  },

  async loadCustomersTab() {
    if (
        !this.currentUser ||
        this.currentUser.role !== 'SELLER'
    ) {
      return;
    }

    const sellerId =
        this.currentUser.data?.id;

    try {
      const result =
          await DueTrackerAPI.getCustomers(
              sellerId
          );

      const customers =
          result.data ||
          result.customers ||
          result ||
          [];

      this.renderCustomersTable(customers);

    } catch (error) {
      console.error(
          'Customers loading error:',
          error
      );
    }
  },

  renderCustomersTable(customers) {
    const table =
        document.getElementById('cust-table');

    if (!table) return;

    const tbody =
        table.querySelector('tbody') || table;

    tbody.innerHTML = '';

    if (!customers.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;">
            No customers found.
          </td>
        </tr>
      `;
      return;
    }

    customers.forEach(customer => {
      const due =
          Number(customer.dueAmount ?? customer.due ?? 0);

      const tr =
          document.createElement('tr');

      tr.innerHTML = `
        <td>${this.escapeHtml(customer.name || '-')}</td>
        <td>${this.escapeHtml(customer.phone || '-')}</td>
        <td>${this.escapeHtml(customer.email || '-')}</td>
        <td>${this.formatCurrency(
          customer.totalPurchases || 0
      )}</td>
        <td>${this.formatCurrency(
          customer.totalPayments || 0
      )}</td>
        <td>${this.formatCurrency(due)}</td>
        <td>
          <button
            class="btn small"
            onclick="App.openEditCustomerModal(${customer.id})">
            Edit
          </button>

          <button
            class="btn small danger"
            onclick="App.confirmDeleteCustomer(${customer.id})">
            Delete
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  },

  async loadTransactionsTab() {
    if (
        !this.currentUser ||
        this.currentUser.role !== 'SELLER'
    ) {
      return;
    }

    const sellerId =
        this.currentUser.data?.id;

    try {
      const result =
          await DueTrackerAPI.getCustomers(
              sellerId
          );

      const customers =
          result.data ||
          result.customers ||
          result ||
          [];

      const table =
          document.getElementById('txn-table');

      if (!table) return;

      const tbody =
          table.querySelector('tbody') || table;

      tbody.innerHTML = '';

      let hasTransactions = false;

      for (const customer of customers) {
        try {
          const statement =
              await DueTrackerAPI.getCustomerStatement(
                  customer.id
              );

          const transactions =
              statement.data ||
              statement.transactions ||
              statement ||
              [];

          if (!Array.isArray(transactions)) {
            continue;
          }

          transactions.forEach(txn => {
            hasTransactions = true;

            const tr =
                document.createElement('tr');

            const type =
                String(
                    txn.type ||
                    txn.transactionType ||
                    ''
                ).toUpperCase();

            tr.innerHTML = `
              <td>${this.escapeHtml(
                customer.name || '-'
            )}</td>

              <td>${this.escapeHtml(
                type || '-'
            )}</td>

              <td>${this.formatCurrency(
                txn.amount || 0
            )}</td>

              <td>${this.escapeHtml(
                txn.description || '-'
            )}</td>

              <td>${this.escapeHtml(
                txn.createdAt ||
                txn.date ||
                '-'
            )}</td>
            `;

            tbody.appendChild(tr);
          });

        } catch (e) {
          console.error(
              `Could not load transactions for customer ${customer.id}`,
              e
          );
        }
      }

      if (!hasTransactions) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;">
              No transactions found.
            </td>
          </tr>
        `;
      }

    } catch (error) {
      console.error(
          'Transactions loading error:',
          error
      );
    }
  },

  async loadSettingsTab() {
    if (
        !this.currentUser ||
        this.currentUser.role !== 'SELLER'
    ) {
      return;
    }

    const seller =
        this.currentUser.data || {};

    this.setValue(
        's-store',
        seller.storeName ||
        seller.store ||
        ''
    );

    this.setValue(
        's-name',
        seller.name || ''
    );

    this.setValue(
        's-email',
        seller.email || ''
    );

    this.setValue(
        's-phone',
        seller.phone || ''
    );

    this.applyTheme(this.currentTheme);
  },

  async handleSaveSettings(event) {
    if (event) {
      event.preventDefault();
    }

    if (!this.currentUser) return;

    const store =
        document.getElementById('s-store')?.value.trim();

    const name =
        document.getElementById('s-name')?.value.trim();

    const email =
        document.getElementById('s-email')?.value.trim();

    const phone =
        document.getElementById('s-phone')?.value.trim();

    this.currentUser.data = {
      ...this.currentUser.data,
      storeName: store,
      name,
      email,
      phone
    };

    sessionStorage.setItem(
        'dt_active_session',
        JSON.stringify(this.currentUser)
    );

    this.updateTopHeader();

    alert('Settings saved successfully.');
  },

  saveSettings(event) {
    return this.handleSaveSettings(event);
  },

  async loadCustomerDashboard(customerId) {
    this.showView('view-customer-dashboard');

    await this.refreshCustomerDashboard(
        customerId
    );
  },

  async refreshCustomerDashboard(customerId) {
    if (
        !customerId &&
        this.currentUser
    ) {
      customerId =
          this.currentUser.data?.id;
    }

    if (!customerId) {
      console.error(
          'Customer ID not found.'
      );
      return;
    }

    try {
      const result =
          await DueTrackerAPI.getCustomerStatement(
              customerId
          );

      const statement =
          result.data ||
          result.statement ||
          result;

      const customer =
          statement.customer ||
          this.currentUser?.data ||
          {};

      const transactions =
          statement.transactions ||
          statement.data ||
          [];

      this.setText(
          'cp-name',
          customer.name || '-'
      );

      this.setText(
          'cp-phone',
          customer.phone || '-'
      );

      let purchases = 0;
      let payments = 0;

      if (Array.isArray(transactions)) {
        transactions.forEach(txn => {
          const amount =
              Number(txn.amount || 0);

          const type =
              String(
                  txn.type ||
                  txn.transactionType ||
                  ''
              ).toUpperCase();

          if (
              type === 'PURCHASE' ||
              type === 'CREDIT'
          ) {
            purchases += amount;
          }

          if (
              type === 'PAYMENT' ||
              type === 'PAID'
          ) {
            payments += amount;
          }
        });
      }

      const due =
          purchases - payments;

      this.setText(
          'cp-purchases',
          this.formatCurrency(purchases)
      );

      this.setText(
          'cp-payments',
          this.formatCurrency(payments)
      );

      this.setText(
          'cp-due',
          this.formatCurrency(due)
      );

      this.renderCustomerTransactions(
          transactions
      );

      this.renderCustomerPaymentArea(
          customer,
          due
      );

    } catch (error) {
      console.error(
          'Customer dashboard error:',
          error
      );
    }
  },

  renderCustomerTransactions(transactions) {
    const table =
        document.getElementById('cp-txn-table');

    if (!table) return;

    const tbody =
        table.querySelector('tbody') || table;

    tbody.innerHTML = '';

    if (
        !Array.isArray(transactions) ||
        transactions.length === 0
    ) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;">
            No transactions found.
          </td>
        </tr>
      `;
      return;
    }

    transactions.forEach(txn => {
      const tr =
          document.createElement('tr');

      tr.innerHTML = `
        <td>${this.escapeHtml(
          txn.type ||
          txn.transactionType ||
          '-'
      )}</td>

        <td>${this.formatCurrency(
          txn.amount || 0
      )}</td>

        <td>${this.escapeHtml(
          txn.description || '-'
      )}</td>

        <td>${this.escapeHtml(
          txn.createdAt ||
          txn.date ||
          '-'
      )}</td>
      `;

      tbody.appendChild(tr);
    });
  },

  renderCustomerPaymentArea(customer, due) {
    const area =
        document.getElementById('cp-pay-area');

    if (!area) return;

    if (due <= 0) {
      area.innerHTML = `
        <div class="payment-success">
          <strong>No outstanding due.</strong>
          <p>Your account is settled.</p>
        </div>
      `;
      return;
    }

    area.innerHTML = `
      <div class="payment-box">
        <div>
          <strong>Outstanding Due</strong>
          <div class="payment-due">
            ${this.formatCurrency(due)}
          </div>
        </div>

        <button
          class="btn primary"
          onclick="App.triggerCustomerOnlinePayment(${customer.id}, ${due})">
          Pay Online
        </button>
      </div>
    `;
  },

  async triggerCustomerOnlinePayment(
      customerId,
      amount
  ) {
    try {
      const response =
          await fetch(
              '/api/payment/create-order',
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                      'application/json'
                },
                body: JSON.stringify({
                  customerId,
                  amount
                })
              }
          );

      if (!response.ok) {
        throw new Error(
            'Unable to create payment order.'
        );
      }

      const order =
          await response.json();

      if (
          typeof Razorpay === 'undefined'
      ) {
        throw new Error(
            'Razorpay checkout is not loaded.'
        );
      }

      const options = {
        key:
            order.keyId ||
            order.key ||
            order.razorpayKey,

        amount:
        order.amount,

        currency:
            order.currency || 'INR',

        name:
            'DueTracker',

        description:
            'Due Payment',

        order_id:
            order.orderId ||
            order.id,

        handler: async response => {
          console.log(
              'Payment successful:',
              response
          );

          try {
            await DueTrackerAPI.recordPayment(
                customerId,
                amount,
                'Online Payment',
                response.razorpay_payment_id
            );

            alert(
                'Payment successful and recorded.'
            );

            await this.refreshCustomerDashboard(
                customerId
            );

          } catch (error) {
            console.error(
                'Payment recording error:',
                error
            );

            alert(
                'Payment succeeded, but recording failed. Please contact the seller.'
            );
          }
        },

        prefill: {
          name:
              this.currentUser?.data?.name ||
              ''
        },

        theme: {
          color: '#22c55e'
        }
      };

      const razorpay =
          new Razorpay(options);

      razorpay.open();

    } catch (error) {
      console.error(
          'Online payment error:',
          error
      );

      alert(
          error.message ||
          'Unable to start payment.'
      );
    }
  },

  closeModals() {
    document
        .querySelectorAll('.overlay')
        .forEach(modal => {
          modal.classList.remove('active');
          modal.style.display = 'none';
        });
  },

  closeModal(modalId) {
    const modal =
        document.getElementById(modalId);

    if (!modal) return;

    modal.classList.remove('active');
    modal.style.display = 'none';
  },

  openModal(modalId) {
    const modal =
        document.getElementById(modalId);

    if (!modal) {
      console.error(
          `Modal not found: ${modalId}`
      );
      return;
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
  },

  openAddCustomerModal() {
    this.openModal('modal-add-cust');

    this.setValue('ac-name', '');
    this.setValue('ac-phone', '');
    this.setValue('ac-email', '');
    this.setValue('ac-addr', '');
  },

  async handleSaveCustomer(event) {
    if (event) {
      event.preventDefault();
    }

    if (
        !this.currentUser ||
        this.currentUser.role !== 'SELLER'
    ) {
      return;
    }

    const name =
        document.getElementById('ac-name')
            ?.value.trim();

    const phone =
        document.getElementById('ac-phone')
            ?.value.trim();

    const email =
        document.getElementById('ac-email')
            ?.value.trim();

    const address =
        document.getElementById('ac-addr')
            ?.value.trim();

    if (!name || !phone) {
      alert(
          'Name and phone are required.'
      );
      return;
    }

    try {
      await DueTrackerAPI.addCustomer(
          this.currentUser.data.id,
          {
            name,
            phone,
            email,
            address
          }
      );

      this.closeModal('modal-add-cust');

      alert(
          'Customer added successfully.'
      );

      await this.refreshSellerDashboard();

      if (
          this.activeTab === 'customers'
      ) {
        await this.loadCustomersTab();
      }

    } catch (error) {
      console.error(
          'Add customer error:',
          error
      );

      alert(
          error.message ||
          'Unable to add customer.'
      );
    }
  },

  addCustomer(event) {
    return this.handleSaveCustomer(event);
  },

  async openEditCustomerModal(customerId) {
    try {
      const sellerId =
          this.currentUser?.data?.id;

      if (!sellerId) return;

      const result =
          await DueTrackerAPI.getCustomers(
              sellerId
          );

      const customers =
          result.data ||
          result.customers ||
          result ||
          [];

      const customer =
          customers.find(
              c => Number(c.id) === Number(customerId)
          );

      if (!customer) {
        alert('Customer not found.');
        return;
      }

      this.setValue(
          'ec-id',
          customer.id
      );

      this.setValue(
          'ec-name',
          customer.name || ''
      );

      this.setValue(
          'ec-phone',
          customer.phone || ''
      );

      this.setValue(
          'ec-email',
          customer.email || ''
      );

      this.setValue(
          'ec-addr',
          customer.address || ''
      );

      this.openModal('modal-edit-cust');

    } catch (error) {
      console.error(
          'Open edit customer error:',
          error
      );
    }
  },

  async handleSaveEditCustomer(event) {
    if (event) {
      event.preventDefault();
    }

    const id =
        document.getElementById('ec-id')
            ?.value;

    const name =
        document.getElementById('ec-name')
            ?.value.trim();

    const phone =
        document.getElementById('ec-phone')
            ?.value.trim();

    const email =
        document.getElementById('ec-email')
            ?.value.trim();

    const address =
        document.getElementById('ec-addr')
            ?.value.trim();

    if (!id || !name || !phone) {
      alert(
          'Customer ID, name and phone are required.'
      );
      return;
    }

    try {
      await DueTrackerAPI.updateCustomer(
          id,
          {
            name,
            phone,
            email,
            address
          }
      );

      this.closeModal('modal-edit-cust');

      alert(
          'Customer updated successfully.'
      );

      await this.refreshSellerDashboard();

      if (
          this.activeTab === 'customers'
      ) {
        await this.loadCustomersTab();
      }

    } catch (error) {
      console.error(
          'Update customer error:',
          error
      );

      alert(
          error.message ||
          'Unable to update customer.'
      );
    }
  },

  updateCustomer(event) {
    return this.handleSaveEditCustomer(event);
  },

  async confirmDeleteCustomer(customerId) {
    if (
        !confirm(
            'Are you sure you want to delete this customer?'
        )
    ) {
      return;
    }

    try {
      await DueTrackerAPI.deleteCustomer(
          customerId
      );

      alert(
          'Customer deleted successfully.'
      );

      await this.refreshSellerDashboard();

      if (
          this.activeTab === 'customers'
      ) {
        await this.loadCustomersTab();
      }

    } catch (error) {
      console.error(
          'Delete customer error:',
          error
      );

      alert(
          error.message ||
          'Unable to delete customer.'
      );
    }
  },

  async openPurchaseModal() {
    const select =
        document.getElementById('pur-cust');

    if (!select) return;

    await this.populateCustomerSelect(
        select
    );

    this.setValue('pur-amt', '');
    this.setValue('pur-desc', '');

    this.openModal('modal-purchase');
  },

  async handleSavePurchase(event) {
    if (event) {
      event.preventDefault();
    }

    const customerId =
        document.getElementById('pur-cust')
            ?.value;

    const amount =
        Number(
            document.getElementById('pur-amt')
                ?.value
        );

    const description =
        document.getElementById('pur-desc')
            ?.value.trim();

    if (
        !customerId ||
        !amount ||
        amount <= 0
    ) {
      alert(
          'Please enter a valid customer and amount.'
      );
      return;
    }

    try {
      await DueTrackerAPI.recordPurchase(
          customerId,
          amount,
          description
      );

      this.closeModal('modal-purchase');

      alert(
          'Purchase recorded successfully.'
      );

      await this.refreshSellerDashboard();

      if (
          this.activeTab === 'customers'
      ) {
        await this.loadCustomersTab();
      }

    } catch (error) {
      console.error(
          'Purchase error:',
          error
      );

      alert(
          error.message ||
          'Unable to record purchase.'
      );
    }
  },

  addPurchase(event) {
    return this.handleSavePurchase(event);
  },

  async openPaymentModal() {
    const select =
        document.getElementById('pay-cust');

    if (!select) return;

    await this.populateCustomerSelect(
        select
    );

    this.setValue('pay-amt', '');
    this.setValue('pay-desc', '');

    this.openModal('modal-payment');
  },

  async handleSavePayment(event) {
    if (event) {
      event.preventDefault();
    }

    const customerId =
        document.getElementById('pay-cust')
            ?.value;

    const amount =
        Number(
            document.getElementById('pay-amt')
                ?.value
        );

    const description =
        document.getElementById('pay-desc')
            ?.value.trim();

    if (
        !customerId ||
        !amount ||
        amount <= 0
    ) {
      alert(
          'Please enter a valid customer and amount.'
      );
      return;
    }

    try {
      await DueTrackerAPI.recordPayment(
          customerId,
          amount,
          description
      );

      this.closeModal('modal-payment');

      alert(
          'Payment recorded successfully.'
      );

      await this.refreshSellerDashboard();

      if (
          this.activeTab === 'customers'
      ) {
        await this.loadCustomersTab();
      }

    } catch (error) {
      console.error(
          'Payment error:',
          error
      );

      alert(
          error.message ||
          'Unable to record payment.'
      );
    }
  },

  addPayment(event) {
    return this.handleSavePayment(event);
  },

  async populateCustomerSelect(select) {
    if (!select) return;

    select.innerHTML =
        '<option value="">Select Customer</option>';

    const sellerId =
        this.currentUser?.data?.id;

    if (!sellerId) return;

    try {
      const result =
          await DueTrackerAPI.getCustomers(
              sellerId
          );

      const customers =
          result.data ||
          result.customers ||
          result ||
          [];

      customers.forEach(customer => {
        const option =
            document.createElement('option');

        option.value =
            customer.id;

        option.textContent =
            `${customer.name} - ${customer.phone}`;

        select.appendChild(option);
      });

    } catch (error) {
      console.error(
          'Customer select error:',
          error
      );
    }
  },

  async openReminderModal(customerId) {
    try {
      const sellerId =
          this.currentUser?.data?.id;

      const result =
          await DueTrackerAPI.getCustomers(
              sellerId
          );

      const customers =
          result.data ||
          result.customers ||
          result ||
          [];

      const customer =
          customers.find(
              c => Number(c.id) === Number(customerId)
          );

      if (!customer) {
        alert('Customer not found.');
        return;
      }

      const due =
          Number(
              customer.dueAmount ??
              customer.due ??
              0
          );

      const seller =
          this.currentUser?.data || {};

      const message =
          `Hello ${customer.name},

This is a reminder from ${seller.storeName || seller.store || 'our store'}.

Your current outstanding due is ${this.formatCurrency(due)}.

Please clear the pending amount at your earliest convenience.

Thank you.`;

      const preview =
          document.getElementById(
              'remind-preview'
          );

      if (preview) {
        preview.value = message;
      }

      const waBtn =
          document.getElementById(
              'remind-wa-btn'
          );

      if (waBtn) {
        waBtn.onclick = () => {
          const phone =
              String(
                  customer.phone || ''
              ).replace(/\D/g, '');

          const url =
              `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

          window.open(
              url,
              '_blank'
          );
        };
      }

      const copyBtn =
          document.getElementById(
              'remind-copy-btn'
          );

      if (copyBtn) {
        copyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(
                message
            );

            alert(
                'Reminder copied.'
            );

          } catch (error) {
            console.error(
                error
            );
          }
        };
      }

      this.openModal(
          'modal-remind'
      );

    } catch (error) {
      console.error(
          'Reminder modal error:',
          error
      );
    }
  },

  showAlert(element, message, type = 'error') {
    if (!element) return;

    element.textContent = message;

    element.className =
        `alert ${type}`;

    element.style.display =
        'block';
  },

  setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
      element.textContent =
          value ?? '';
    }
  },

  setValue(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
      element.value =
          value ?? '';
    }
  },

  formatCurrency(value) {
    const number =
        Number(value || 0);

    return new Intl.NumberFormat(
        'en-IN',
        {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2
        }
    ).format(number);
  },

  escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
  },

  escape(value) {
    return this.escapeHtml(value);
  }

};


// Compatibility aliases for the existing HTML
window.App = window.DueTrackerApp;


// Existing HTML uses these names
window.DueTrackerApp.togglePw =
    function(inputId, btnEl) {
      return this.togglePassword(
          inputId,
          btnEl
      );
    };

window.DueTrackerApp.sellerMode =
    function(mode) {
      return this.toggleSellerAuthMode(
          mode
      );
    };


// Support DOMContentLoaded
document.addEventListener(
    'DOMContentLoaded',
    function() {
      if (
          window.DueTrackerApp &&
          typeof window.DueTrackerApp.init ===
          'function'
      ) {
        window.DueTrackerApp.init();
      }
    }
);