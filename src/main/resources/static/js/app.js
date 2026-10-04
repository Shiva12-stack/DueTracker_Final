/*
  DueTracker Core Application Logic Engine
  Supports Centered Screen Positioning, Shop Owner Portal,
  Edit/Delete Customer, Reminders, Mobile Sidebar & Compatibility
*/

window.DueTrackerApp = {

  currentUser: null,
  activeTab: 'dashboard',
  currentTheme: localStorage.getItem('dt_theme') || 'dark',

  // =========================================================
  // INITIALIZATION
  // =========================================================

  init() {
    console.log("DueTracker initialized.");

    this.applyTheme(this.currentTheme);

    const savedSession =
        sessionStorage.getItem('dt_active_session');

    if (savedSession) {
      try {
        this.currentUser = JSON.parse(savedSession);

        if (
            this.currentUser &&
            this.currentUser.role === 'SELLER'
        ) {
          this.loadSellerPortal();
          return;
        }

        if (
            this.currentUser &&
            this.currentUser.role === 'CUSTOMER'
        ) {
          this.loadCustomerDashboard(
              this.currentUser.data.id
          );
          return;
        }

      } catch (e) {
        console.error(
            "Session restore error:",
            e
        );

        sessionStorage.removeItem(
            'dt_active_session'
        );
      }
    }

    this.navigateLanding();
  },

  // =========================================================
  // PASSWORD
  // =========================================================

  togglePassword(inputId, btnEl) {

    const input =
        document.getElementById(inputId);

    if (!input) return;

    if (input.type === 'password') {

      input.type = 'text';

      if (btnEl) {
        btnEl.innerText = 'Hide';
      }

    } else {

      input.type = 'password';

      if (btnEl) {
        btnEl.innerText = 'Show';
      }
    }
  },

  // =========================================================
  // THEME
  // =========================================================

  toggleTheme() {

    this.currentTheme =
        this.currentTheme === 'dark'
            ? 'light'
            : 'dark';

    localStorage.setItem(
        'dt_theme',
        this.currentTheme
    );

    this.applyTheme(
        this.currentTheme
    );
  },

  applyTheme(theme) {

    document.documentElement.setAttribute(
        'data-theme',
        theme
    );

    const textEl =
        document.getElementById(
            'theme-toggle-text'
        );

    const badgeEl =
        document.getElementById(
            'theme-badge'
        );

    const settingsLabel =
        document.getElementById(
            'settings-theme-label'
        );

    const alternateLabel =
        document.getElementById(
            's-theme-label'
        );

    if (theme === 'light') {

      if (textEl) {
        textEl.innerText =
            '☀️ Light Mode';
      }

      if (badgeEl) {
        badgeEl.innerText = 'Light';
      }

      if (settingsLabel) {
        settingsLabel.innerText =
            'Switch to Dark Mode 🌙';
      }

      if (alternateLabel) {
        alternateLabel.innerText =
            'Light Mode';
      }

    } else {

      if (textEl) {
        textEl.innerText =
            '🌙 Dark Mode';
      }

      if (badgeEl) {
        badgeEl.innerText = 'Dark';
      }

      if (settingsLabel) {
        settingsLabel.innerText =
            'Switch to Light Mode ☀️';
      }

      if (alternateLabel) {
        alternateLabel.innerText =
            'Dark Mode';
      }
    }
  },

  // =========================================================
  // VIEW MANAGEMENT
  // =========================================================

  showView(viewId) {

    document
        .querySelectorAll(
            '.view-portal, .view'
        )
        .forEach(el => {
          el.classList.remove('active');
        });

    const target =
        document.getElementById(viewId);

    if (target) {
      target.classList.add('active');
    }

    const sidebar =
        document.getElementById(
            'app-sidebar'
        ) ||
        document.getElementById(
            'sidebar'
        );

    const layout =
        document.getElementById(
            'app-layout'
        ) ||
        document.getElementById(
            'main'
        );

    const topHeader =
        document.getElementById(
            'top-header'
        );

    const isAuthPage =
        viewId === 'view-landing' ||
        viewId === 'view-seller-auth' ||
        viewId === 'view-customer-auth';

    if (
        isAuthPage ||
        !this.currentUser
    ) {

      if (sidebar) {
        sidebar.classList.add(
            'hidden'
        );

        sidebar.classList.remove(
            'mobile-open'
        );
      }

      if (layout) {
        layout.classList.add(
            'no-sidebar'
        );
      }

      if (topHeader) {
        topHeader.style.display =
            'none';
      }

    } else {

      if (sidebar) {
        sidebar.classList.remove(
            'hidden'
        );
      }

      if (layout) {
        layout.classList.remove(
            'no-sidebar'
        );
      }

      if (topHeader) {
        topHeader.style.display =
            'flex';
      }
    }

    this.updateTopHeader();
  },

  navigateLanding() {

    this.currentUser = null;

    sessionStorage.removeItem(
        'dt_active_session'
    );

    this.showView(
        'view-landing'
    );
  },

  goHome() {
    this.navigateLanding();
  },

  // =========================================================
  // SELLER AUTH VIEW
  // =========================================================

  showSellerAuth(
      mode = 'login'
  ) {

    this.showView(
        'view-seller-auth'
    );

    this.toggleSellerAuthMode(
        mode
    );
  },

  toggleSellerAuthMode(mode) {

    const loginBox =
        document.getElementById(
            'seller-login-box'
        ) ||
        document.getElementById(
            'seller-login-card'
        );

    const regBox =
        document.getElementById(
            'seller-register-box'
        ) ||
        document.getElementById(
            'seller-register-card'
        );

    if (mode === 'register') {

      if (loginBox) {
        loginBox.style.display =
            'none';
      }

      if (regBox) {
        regBox.style.display =
            'block';
      }

    } else {

      if (loginBox) {
        loginBox.style.display =
            'block';
      }

      if (regBox) {
        regBox.style.display =
            'none';
      }
    }
  },

  showCustomerAuth() {

    this.showView(
        'view-customer-auth'
    );
  },

  // =========================================================
  // HEADER
  // =========================================================

  updateTopHeader() {

    const headerBadges =
        document.getElementById(
            'top-header-badges'
        );

    const titleEl =
        document.getElementById(
            'page-title-text'
        ) ||
        document.getElementById(
            'page-title'
        );

    const storeChip =
        document.getElementById(
            'store-chip'
        );

    if (!this.currentUser) {

      if (titleEl) {
        titleEl.innerText =
            'DueTracker Portal';
      }

      if (headerBadges) {
        headerBadges.innerHTML = '';
      }

      return;
    }

    if (
        this.currentUser.role ===
        'SELLER'
    ) {

      const seller =
          this.currentUser.data || {};

      const storeName =
          seller.storeName ||
          seller.store ||
          'My Store';

      if (titleEl) {
        titleEl.innerText =
            this.getTabTitle(
                this.activeTab
            );
      }

      if (storeChip) {
        storeChip.innerText =
            storeName;
      }

      if (headerBadges) {

        headerBadges.innerHTML = `
          <div class="store-badge">
            🏪 ${this.escapeHtml(
            storeName
        )}
          </div>

          <span class="role-badge">
            Shop Owner
          </span>
        `;
      }

    } else {

      if (titleEl) {
        titleEl.innerText =
            'Customer Portal Dashboard';
      }

      if (headerBadges) {

        headerBadges.innerHTML = `
          <span
            class="role-badge"
            style="
              background: rgba(0,180,216,.15);
              color:#00b4d8;
            "
          >
            Customer
          </span>
        `;
      }
    }
  },

  getTabTitle(tab) {

    switch (tab) {

      case 'dashboard':
        return 'Dashboard Overview';

      case 'customers':
        return 'Customer Directory';

      case 'transactions':
        return 'Transaction Logs';

      case 'settings':
        return 'Store Settings';

      default:
        return 'Dashboard';
    }
  },

  // =========================================================
  // SIDEBAR / MENU
  // =========================================================

  toggleSidebar() {

    const sidebar =
        document.getElementById(
            'app-sidebar'
        ) ||
        document.getElementById(
            'sidebar'
        );

    if (!sidebar) {
      return;
    }

    sidebar.classList.toggle(
        'mobile-open'
    );
  },

  closeSidebar() {

    const sidebar =
        document.getElementById(
            'app-sidebar'
        ) ||
        document.getElementById(
            'sidebar'
        );

    if (sidebar) {

      sidebar.classList.remove(
          'mobile-open'
      );
    }
  },

  // =========================================================
  // LOGOUT
  // =========================================================

  logout() {

    this.currentUser = null;

    sessionStorage.removeItem(
        'dt_active_session'
    );

    this.closeSidebar();

    this.navigateLanding();
  },

  // =========================================================
  // TAB SWITCHING
  // =========================================================

  switchTab(tabId) {

    this.activeTab = tabId;

    document
        .querySelectorAll(
            '.menu-link, .sb-link'
        )
        .forEach(btn => {
          btn.classList.remove(
              'active'
          );
        });

    const activeBtn =
        document.getElementById(
            `nav-item-${tabId}`
        ) ||
        document.querySelector(
            `.sb-link[data-tab="${tabId}"]`
        );

    if (activeBtn) {
      activeBtn.classList.add(
          'active'
      );
    }

    document
        .querySelectorAll(
            '.tab-content'
        )
        .forEach(content => {
          content.classList.remove(
              'active'
          );
        });

    const activeContent =
        document.getElementById(
            `tab-${tabId}`
        );

    if (activeContent) {
      activeContent.classList.add(
          'active'
      );
    }

    this.updateTopHeader();

    this.closeSidebar();

    if (
        this.currentUser &&
        this.currentUser.role ===
        'SELLER'
    ) {

      if (
          tabId === 'dashboard'
      ) {
        this.refreshSellerDashboard();
      }

      if (
          tabId === 'customers'
      ) {
        this.loadCustomersTab();
      }

      if (
          tabId === 'transactions'
      ) {
        this.loadTransactionsTab();
      }

      if (
          tabId === 'settings'
      ) {
        this.loadSettingsTab();
      }
    }
  },

  tab(tabId) {
    this.switchTab(tabId);
  },

  // =========================================================
  // SELLER REGISTER
  // =========================================================

  async handleSellerRegister(e) {

    if (e) {
      e.preventDefault();
    }

    const alertEl =
        document.getElementById(
            'seller-register-alert'
        ) ||
        document.getElementById(
            'sr-alert'
        );

    if (alertEl) {
      alertEl.innerHTML = '';
    }

    const name =
        this.getValue(
            'reg-name'
        ) ||
        this.getValue(
            'sr-name'
        );

    const storeName =
        this.getValue(
            'reg-store'
        ) ||
        this.getValue(
            'sr-store'
        );

    const email =
        this.getValue(
            'reg-email'
        ) ||
        this.getValue(
            'sr-email'
        );

    const phone =
        this.getValue(
            'reg-phone'
        ) ||
        this.getValue(
            'sr-phone'
        );

    const password =
        this.getValue(
            'reg-pass'
        ) ||
        this.getValue(
            'sr-pass'
        );

    if (
        !name ||
        !storeName ||
        !email ||
        !phone ||
        !password
    ) {

      this.showAlert(
          alertEl,
          'Please fill all required fields.',
          'error'
      );

      return;
    }

    const data = {

      name: name,

      storeName: storeName,

      email: email,

      phone: phone,

      password: password
    };

    try {

      await DueTrackerAPI
          .registerSeller(data);

      this.showAlert(
          alertEl,
          'Shop registered successfully. Please login.',
          'success'
      );

      setTimeout(() => {

        this.toggleSellerAuthMode(
            'login'
        );

        const loginEmail =
            document.getElementById(
                'seller-login-email'
            ) ||
            document.getElementById(
                'sl-email'
            );

        if (loginEmail) {
          loginEmail.value =
              email;
        }

      }, 1000);

    } catch (err) {

      console.error(
          'Registration error:',
          err
      );

      this.showAlert(
          alertEl,
          err.message ||
          'Registration failed.',
          'error'
      );
    }
  },

  sellerRegister(e) {
    return this.handleSellerRegister(e);
  },

  // =========================================================
  // SELLER LOGIN
  // =========================================================

  async handleSellerLogin(e) {

    if (e) {
      e.preventDefault();
    }

    const alertEl =
        document.getElementById(
            'seller-login-alert'
        ) ||
        document.getElementById(
            'sl-alert'
        );

    const identifier =
        this.getValue(
            'seller-login-email'
        ) ||
        this.getValue(
            'sl-email'
        );

    const password =
        this.getValue(
            'seller-login-pass'
        ) ||
        this.getValue(
            'sl-pass'
        );

    if (
        !identifier ||
        !password
    ) {

      this.showAlert(
          alertEl,
          'Please enter email/phone and password.',
          'error'
      );

      return;
    }

    try {

      const res =
          await DueTrackerAPI
              .loginSeller(
                  identifier,
                  password
              );

      const seller =
          res.seller ||
          res.data ||
          res;

      this.currentUser = {

        role: 'SELLER',

        data: seller
      };

      sessionStorage.setItem(
          'dt_active_session',
          JSON.stringify(
              this.currentUser
          )
      );

      await this.loadSellerPortal();

    } catch (err) {

      console.error(
          'Seller login error:',
          err
      );

      this.showAlert(
          alertEl,
          err.message ||
          'Invalid seller email/phone or password!',
          'error'
      );
    }
  },

  sellerLogin(e) {
    return this.handleSellerLogin(e);
  },

  // =========================================================
  // CUSTOMER LOGIN
  // =========================================================

  async handleCustomerLogin(e) {

    if (e) {
      e.preventDefault();
    }

    const alertEl =
        document.getElementById(
            'customer-login-alert'
        ) ||
        document.getElementById(
            'cl-alert'
        );

    const name =
        this.getValue(
            'cust-login-name'
        ) ||
        this.getValue(
            'cl-name'
        );

    const phone =
        this.getValue(
            'cust-login-phone'
        ) ||
        this.getValue(
            'cl-phone'
        );

    if (!name || !phone) {

      this.showAlert(
          alertEl,
          'Please enter your name and phone number.',
          'error'
      );

      return;
    }

    try {

      const res =
          await DueTrackerAPI
              .loginCustomer(
                  name,
                  phone
              );

      const customer =
          res.customer ||
          res.data ||
          res;

      this.currentUser = {

        role: 'CUSTOMER',

        data: customer
      };

      sessionStorage.setItem(
          'dt_active_session',
          JSON.stringify(
              this.currentUser
          )
      );

      await this.loadCustomerDashboard(
          customer.id
      );

    } catch (err) {

      console.error(
          'Customer login error:',
          err
      );

      this.showAlert(
          alertEl,
          err.message ||
          'Customer login failed.',
          'error'
      );
    }
  },

  customerLogin(e) {
    return this.handleCustomerLogin(e);
  },

  // =========================================================
  // SELLER PORTAL
  // =========================================================

  async loadSellerPortal() {

    this.showView(
        'view-seller-portal'
    );

    this.activeTab =
        'dashboard';

    await this.refreshSellerDashboard();
  },

  async refreshSellerPortal() {

    await this.refreshSellerDashboard();
  },

  // =========================================================
  // SELLER DASHBOARD
  // =========================================================

  async refreshSellerDashboard() {

    if (
        !this.currentUser ||
        this.currentUser.role !==
        'SELLER'
    ) {
      return;
    }

    const sellerId =
        this.currentUser.data?.id;

    if (!sellerId) {
      console.error(
          'Seller ID not found.'
      );
      return;
    }

    try {

      const summary =
          await DueTrackerAPI
              .getSellerDashboard(
                  sellerId
              );

      const totalCustomers =
          summary.totalCustomers ??
          summary.customerCount ??
          0;

      const totalPurchases =
          summary.totalPurchases ??
          0;

      const totalPayments =
          summary.totalPayments ??
          0;

      const totalDue =
          summary.totalPendingDue ??
          summary.totalDue ??
          summary.pendingDue ??
          0;

      this.setText(
          'stat-total-customers',
          totalCustomers
      );

      this.setText(
          'm-customers',
          totalCustomers
      );

      this.setText(
          'stat-total-purchases',
          '₹' +
          this.formatCurrency(
              totalPurchases
          )
      );

      this.setText(
          'm-purchases',
          this.formatCurrency(
              totalPurchases
          )
      );

      this.setText(
          'stat-total-payments',
          '₹' +
          this.formatCurrency(
              totalPayments
          )
      );

      this.setText(
          'm-payments',
          this.formatCurrency(
              totalPayments
          )
      );

      this.setText(
          'stat-total-due',
          '₹' +
          this.formatCurrency(
              totalDue
          )
      );

      this.setText(
          'm-dues',
          this.formatCurrency(
              totalDue
          )
      );

      if (summary.storeName) {

        this.currentUser.data.storeName =
            summary.storeName;

        this.updateTopHeader();
      }

      const customers =
          await DueTrackerAPI
              .getCustomers(
                  sellerId
              );

      await this.renderSellerCustomerTable(
          customers
      );

    } catch (err) {

      console.error(
          'Dashboard error:',
          err
      );
    }
  },

  async renderSellerCustomerTable(
      customers
  ) {

    const tbody =
        document.getElementById(
            'seller-dash-customer-table'
        ) ||
        document.getElementById(
            'dash-table'
        );

    if (!tbody) {
      return;
    }

    tbody.innerHTML = '';

    if (
        !Array.isArray(customers) ||
        customers.length === 0
    ) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="8"
            style="
              text-align:center;
              padding:2rem;
              color:var(--text-muted);
            "
          >
            No customers added yet.
          </td>
        </tr>
      `;

      return;
    }

    for (
        const customer of customers
        ) {

      try {

        const statement =
            await DueTrackerAPI
                .getCustomerStatement(
                    customer.id
                );

        const purchases =
            Number(
                statement.totalPurchases ||
                0
            );

        const payments =
            Number(
                statement.totalPayments ||
                0
            );

        const due =
            Number(
                statement.pendingDue ??
                purchases - payments
            );

        const tr =
            document.createElement(
                'tr'
            );

        tr.innerHTML = `

          <td>
            #${customer.id}
          </td>

          <td>
            <strong>
              ${this.escapeHtml(
            customer.name
        )}
            </strong>
          </td>

          <td>
            ${this.escapeHtml(
            customer.phone
        )}
          </td>

          <td>
            ₹${this.formatCurrency(
            purchases
        )}
          </td>

          <td>
            ₹${this.formatCurrency(
            payments
        )}
          </td>

          <td>
            ₹${this.formatCurrency(
            due
        )}
          </td>

          <td>

            <button
              class="btn btn-secondary"
              onclick="
                App.openPurchaseModal(
                  ${customer.id}
                )
              "
            >
              + Pur
            </button>

            <button
              class="btn btn-success"
              onclick="
                App.openPaymentModal(
                  ${customer.id}
                )
              "
            >
              + Pay
            </button>

            <button
              class="btn btn-info"
              onclick="
                App.openEditCustomerModal(
                  ${customer.id}
                )
              "
            >
              Edit
            </button>

            <button
              class="btn btn-danger"
              onclick="
                App.confirmDeleteCustomer(
                  ${customer.id}
                )
              "
            >
              Delete
            </button>

          </td>
        `;

        tbody.appendChild(tr);

      } catch (error) {

        console.error(
            'Customer statement error:',
            error
        );
      }
    }
  },

  // =========================================================
  // CUSTOMERS TAB
  // =========================================================

  async loadCustomersTab() {

    if (
        !this.currentUser ||
        this.currentUser.role !==
        'SELLER'
    ) {
      return;
    }

    try {

      const customers =
          await DueTrackerAPI
              .getCustomers(
                  this.currentUser.data.id
              );

      const tbody =
          document.getElementById(
              'seller-customers-full-table'
          ) ||
          document.getElementById(
              'cust-table'
          );

      if (!tbody) {
        return;
      }

      tbody.innerHTML = '';

      if (
          !Array.isArray(customers) ||
          customers.length === 0
      ) {

        tbody.innerHTML = `
          <tr>
            <td
              colspan="8"
              style="
                text-align:center;
                padding:2rem;
              "
            >
              No customers added yet.
            </td>
          </tr>
        `;

        return;
      }

      for (
          const customer of customers
          ) {

        const statement =
            await DueTrackerAPI
                .getCustomerStatement(
                    customer.id
                );

        const due =
            Number(
                statement.pendingDue || 0
            );

        const tr =
            document.createElement(
                'tr'
            );

        tr.innerHTML = `

          <td>
            #${customer.id}
          </td>

          <td>
            ${this.escapeHtml(
            customer.name
        )}
          </td>

          <td>
            ${this.escapeHtml(
            customer.phone
        )}
          </td>

          <td>
            ${this.escapeHtml(
            customer.email || '-'
        )}
          </td>

          <td>
            ${this.escapeHtml(
            customer.address || '-'
        )}
          </td>

          <td>
            ₹${this.formatCurrency(
            due
        )}
          </td>

          <td>

            <button
              class="btn btn-info"
              onclick="
                App.openEditCustomerModal(
                  ${customer.id}
                )
              "
            >
              Edit
            </button>

            <button
              class="btn btn-danger"
              onclick="
                App.confirmDeleteCustomer(
                  ${customer.id}
                )
              "
            >
              Delete
            </button>

          </td>
        `;

        tbody.appendChild(tr);
      }

    } catch (err) {

      console.error(
          'Customers error:',
          err
      );
    }
  },

  // =========================================================
  // TRANSACTIONS
  // =========================================================

  async loadTransactionsTab() {

    if (
        !this.currentUser ||
        this.currentUser.role !==
        'SELLER'
    ) {
      return;
    }

    try {

      const customers =
          await DueTrackerAPI
              .getCustomers(
                  this.currentUser.data.id
              );

      const tbody =
          document.getElementById(
              'seller-all-transactions-table'
          ) ||
          document.getElementById(
              'txn-table'
          );

      if (!tbody) {
        return;
      }

      tbody.innerHTML = '';

      let found = false;

      for (
          const customer of customers
          ) {

        const result =
            await DueTrackerAPI
                .getCustomerStatement(
                    customer.id
                );

        const transactions =
            result.transactions ||
            result.data ||
            [];

        if (
            !Array.isArray(
                transactions
            )
        ) {
          continue;
        }

        transactions.forEach(
            transaction => {

              found = true;

              const tr =
                  document.createElement(
                      'tr'
                  );

              tr.innerHTML = `

              <td>
                ${this.escapeHtml(
                  customer.name
              )}
              </td>

              <td>
                ${this.escapeHtml(
                  transaction.type ||
                  transaction.transactionType ||
                  '-'
              )}
              </td>

              <td>
                ₹${this.formatCurrency(
                  transaction.amount
              )}
              </td>

              <td>
                ${this.escapeHtml(
                  transaction.description ||
                  '-'
              )}
              </td>

              <td>
                ${this.escapeHtml(
                  transaction.createdAt ||
                  transaction.date ||
                  '-'
              )}
              </td>

            `;

              tbody.appendChild(
                  tr
              );
            }
        );
      }

      if (!found) {

        tbody.innerHTML = `
          <tr>
            <td
              colspan="5"
              style="text-align:center;"
            >
              No transactions found.
            </td>
          </tr>
        `;
      }

    } catch (err) {

      console.error(
          'Transactions error:',
          err
      );
    }
  },

  // =========================================================
  // SETTINGS
  // =========================================================

  async loadSettingsTab() {

    if (
        !this.currentUser ||
        this.currentUser.role !==
        'SELLER'
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

    this.applyTheme(
        this.currentTheme
    );
  },

  async handleSaveSettings(e) {

    if (e) {
      e.preventDefault();
    }

    if (!this.currentUser) {
      return;
    }

    this.currentUser.data = {

      ...this.currentUser.data,

      storeName:
          this.getValue(
              's-store'
          ),

      name:
          this.getValue(
              's-name'
          ),

      email:
          this.getValue(
              's-email'
          ),

      phone:
          this.getValue(
              's-phone'
          )
    };

    sessionStorage.setItem(
        'dt_active_session',
        JSON.stringify(
            this.currentUser
        )
    );

    this.updateTopHeader();

    alert(
        'Settings saved successfully.'
    );
  },

  saveSettings(e) {
    return this.handleSaveSettings(e);
  },

  // =========================================================
  // ADD CUSTOMER
  // =========================================================

  openAddCustomerModal() {

    this.setValue(
        'ac-name',
        ''
    );

    this.setValue(
        'ac-phone',
        ''
    );

    this.setValue(
        'ac-email',
        ''
    );

    this.setValue(
        'ac-addr',
        ''
    );

    this.openModal(
        'modal-add-cust'
    );
  },

  async handleSaveCustomer(e) {

    if (e) {
      e.preventDefault();
    }

    if (
        !this.currentUser ||
        this.currentUser.role !==
        'SELLER'
    ) {
      return;
    }

    const name =
        this.getValue(
            'ac-name'
        );

    const phone =
        this.getValue(
            'ac-phone'
        );

    const email =
        this.getValue(
            'ac-email'
        );

    const address =
        this.getValue(
            'ac-addr'
        );

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

      this.closeModal(
          'modal-add-cust'
      );

      alert(
          'Customer added successfully.'
      );

      await this.refreshSellerDashboard();

      if (
          this.activeTab ===
          'customers'
      ) {
        await this.loadCustomersTab();
      }

    } catch (err) {

      console.error(
          'Add customer error:',
          err
      );

      alert(
          err.message ||
          'Unable to add customer.'
      );
    }
  },

  addCustomer(e) {
    return this.handleSaveCustomer(e);
  },

  // =========================================================
  // EDIT CUSTOMER
  // =========================================================

  async openEditCustomerModal(
      customerId
  ) {

    try {

      const customers =
          await DueTrackerAPI
              .getCustomers(
                  this.currentUser.data.id
              );

      const customer =
          customers.find(
              c =>
                  Number(c.id) ===
                  Number(customerId)
          );

      if (!customer) {

        alert(
            'Customer not found.'
        );

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

      this.openModal(
          'modal-edit-cust'
      );

    } catch (err) {

      console.error(
          'Edit customer error:',
          err
      );

      alert(
          'Unable to load customer.'
      );
    }
  },

  async handleSaveEditCustomer(e) {

    if (e) {
      e.preventDefault();
    }

    const id =
        this.getValue(
            'ec-id'
        );

    const name =
        this.getValue(
            'ec-name'
        );

    const phone =
        this.getValue(
            'ec-phone'
        );

    const email =
        this.getValue(
            'ec-email'
        );

    const address =
        this.getValue(
            'ec-addr'
        );

    if (
        !id ||
        !name ||
        !phone
    ) {

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

      this.closeModal(
          'modal-edit-cust'
      );

      alert(
          'Customer updated successfully.'
      );

      await this.refreshSellerDashboard();

      if (
          this.activeTab ===
          'customers'
      ) {
        await this.loadCustomersTab();
      }

    } catch (err) {

      console.error(
          'Update customer error:',
          err
      );

      alert(
          err.message ||
          'Unable to update customer.'
      );
    }
  },

  updateCustomer(e) {
    return this.handleSaveEditCustomer(e);
  },

  // =========================================================
  // DELETE CUSTOMER
  // =========================================================

  async confirmDeleteCustomer(
      customerId
  ) {

    if (
        !confirm(
            'Are you sure you want to delete this customer?'
        )
    ) {
      return;
    }

    try {

      await DueTrackerAPI
          .deleteCustomer(
              customerId
          );

      alert(
          'Customer deleted successfully.'
      );

      await this.refreshSellerDashboard();

      if (
          this.activeTab ===
          'customers'
      ) {
        await this.loadCustomersTab();
      }

    } catch (err) {

      console.error(
          'Delete customer error:',
          err
      );

      alert(
          err.message ||
          'Unable to delete customer.'
      );
    }
  },

  // =========================================================
  // PURCHASE
  // =========================================================

  async openPurchaseModal(
      customerId = null
  ) {

    const select =
        document.getElementById(
            'pur-cust'
        );

    if (select) {

      await this.populateCustomerSelect(
          select
      );

      if (customerId) {
        select.value =
            customerId;
      }
    }

    this.setValue(
        'pur-amt',
        ''
    );

    this.setValue(
        'pur-desc',
        ''
    );

    this.openModal(
        'modal-purchase'
    );
  },

  async handleSavePurchase(e) {

    if (e) {
      e.preventDefault();
    }

    const customerId =
        this.getValue(
            'pur-cust'
        );

    const amount =
        Number(
            this.getValue(
                'pur-amt'
            )
        );

    const description =
        this.getValue(
            'pur-desc'
        );

    if (
        !customerId ||
        !amount ||
        amount <= 0
    ) {

      alert(
          'Please select a customer and enter a valid amount.'
      );

      return;
    }

    try {

      await DueTrackerAPI
          .recordPurchase(
              customerId,
              amount,
              description
          );

      this.closeModal(
          'modal-purchase'
      );

      alert(
          'Purchase recorded successfully.'
      );

      await this.refreshSellerDashboard();

    } catch (err) {

      console.error(
          'Purchase error:',
          err
      );

      alert(
          err.message ||
          'Unable to record purchase.'
      );
    }
  },

  addPurchase(e) {
    return this.handleSavePurchase(e);
  },

  // =========================================================
  // PAYMENT
  // =========================================================

  async openPaymentModal(
      customerId = null
  ) {

    const select =
        document.getElementById(
            'pay-cust'
        );

    if (select) {

      await this.populateCustomerSelect(
          select
      );

      if (customerId) {
        select.value =
            customerId;
      }
    }

    this.setValue(
        'pay-amt',
        ''
    );

    this.setValue(
        'pay-desc',
        ''
    );

    this.openModal(
        'modal-payment'
    );
  },

  async handleSavePayment(e) {

    if (e) {
      e.preventDefault();
    }

    const customerId =
        this.getValue(
            'pay-cust'
        );

    const amount =
        Number(
            this.getValue(
                'pay-amt'
            )
        );

    const description =
        this.getValue(
            'pay-desc'
        );

    if (
        !customerId ||
        !amount ||
        amount <= 0
    ) {

      alert(
          'Please select a customer and enter a valid amount.'
      );

      return;
    }

    try {

      await DueTrackerAPI
          .recordPayment(
              customerId,
              amount,
              description
          );

      this.closeModal(
          'modal-payment'
      );

      alert(
          'Payment recorded successfully.'
      );

      await this.refreshSellerDashboard();

    } catch (err) {

      console.error(
          'Payment error:',
          err
      );

      alert(
          err.message ||
          'Unable to record payment.'
      );
    }
  },

  addPayment(e) {
    return this.handleSavePayment(e);
  },

  // =========================================================
  // CUSTOMER SELECT
  // =========================================================

  async populateCustomerSelect(
      select
  ) {

    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="">
        Select Customer
      </option>
    `;

    try {

      const customers =
          await DueTrackerAPI
              .getCustomers(
                  this.currentUser.data.id
              );

      customers.forEach(
          customer => {

            const option =
                document.createElement(
                    'option'
                );

            option.value =
                customer.id;

            option.textContent =
                `${customer.name} - ${customer.phone}`;

            select.appendChild(
                option
            );
          }
      );

    } catch (err) {

      console.error(
          'Customer select error:',
          err
      );
    }
  },

  // =========================================================
  // PAYMENT REMINDER
  // =========================================================

  async openReminderModal(
      customerId
  ) {

    try {

      const statement =
          await DueTrackerAPI
              .getCustomerStatement(
                  customerId
              );

      const customer =
          statement.customer;

      const storeName =
          (
              this.currentUser &&
              this.currentUser.data &&
              this.currentUser.data.storeName
          ) ||
          'Our Shop';

      const dueAmount =
          Number(
              statement.pendingDue ||
              0
          );

      const message =
          `Hello ${customer.name},\n\n` +
          `This is a payment reminder from ${storeName}.\n\n` +
          `Your current pending due is ` +
          `${this.formatCurrency(dueAmount)}.\n\n` +
          `Kindly make the payment at your earliest convenience.\n\n` +
          `Thank you!`;

      const preview =
          document.getElementById(
              'reminder-preview-box'
          ) ||
          document.getElementById(
              'remind-preview'
          );

      if (preview) {

        if (
            'value' in preview
        ) {

          preview.value =
              message;

        } else {

          preview.innerHTML =
              this.escapeHtml(
                  message
              );
        }
      }

      const waBtn =
          document.getElementById(
              'btn-wa-reminder'
          ) ||
          document.getElementById(
              'remind-wa-btn'
          );

      if (waBtn) {

        waBtn.onclick =
            () => {

              const cleanPhone =
                  String(
                      customer.phone ||
                      ''
                  ).replace(
                      /[^0-9]/g,
                      ''
                  );

              const waPhone =
                  cleanPhone.length === 10
                      ? '91' +
                      cleanPhone
                      : cleanPhone;

              const waUrl =
                  `https://wa.me/${waPhone}` +
                  `?text=${encodeURIComponent(
                      message
                  )}`;

              window.open(
                  waUrl,
                  '_blank'
              );
            };
      }

      const copyBtn =
          document.getElementById(
              'btn-copy-reminder'
          ) ||
          document.getElementById(
              'remind-copy-btn'
          );

      if (copyBtn) {

        copyBtn.onclick =
            async () => {

              try {

                await navigator
                    .clipboard
                    .writeText(
                        message
                    );

                alert(
                    'Reminder message copied!'
                );

              } catch (error) {

                console.error(
                    error
                );

                alert(
                    'Unable to copy reminder.'
                );
              }
            };
      }

      this.openModal(
          'modal-send-reminder'
      );

      this.openModal(
          'modal-remind'
      );

    } catch (err) {

      console.error(
          'Reminder error:',
          err
      );

      alert(
          err.message ||
          'Unable to create reminder.'
      );
    }
  },

  // =========================================================
  // CUSTOMER DASHBOARD
  // =========================================================

  async loadCustomerDashboard(
      customerId
  ) {

    this.showView(
        'view-customer-dashboard'
    );

    await this.refreshCustomerDashboard(
        customerId
    );
  },

  async refreshCustomerDashboard(
      customerId
  ) {

    if (!customerId) {

      customerId =
          this.currentUser?.data?.id;
    }

    if (!customerId) {

      console.error(
          'Customer ID not found.'
      );

      return;
    }

    try {

      const data =
          await DueTrackerAPI
              .getCustomerStatement(
                  customerId
              );

      const customer =
          data.customer ||
          this.currentUser.data;

      const totalPurchases =
          Number(
              data.totalPurchases ||
              0
          );

      const totalPayments =
          Number(
              data.totalPayments ||
              0
          );

      const pendingDue =
          Number(
              data.pendingDue ??
              totalPurchases -
              totalPayments
          );

      this.setText(
          'cust-profile-name',
          customer.name || '-'
      );

      this.setText(
          'cp-name',
          customer.name || '-'
      );

      this.setText(
          'cust-profile-id',
          `#${customer.id}`
      );

      this.setText(
          'cust-profile-phone',
          customer.phone || '-'
      );

      this.setText(
          'cp-phone',
          customer.phone || '-'
      );

      this.setText(
          'cust-stat-purchases',
          '₹' +
          this.formatCurrency(
              totalPurchases
          )
      );

      this.setText(
          'cp-purchases',
          this.formatCurrency(
              totalPurchases
          )
      );

      this.setText(
          'cust-stat-payments',
          '₹' +
          this.formatCurrency(
              totalPayments
          )
      );

      this.setText(
          'cp-payments',
          this.formatCurrency(
              totalPayments
          )
      );

      this.setText(
          'cust-stat-due',
          '₹' +
          this.formatCurrency(
              pendingDue
          )
      );

      this.setText(
          'cp-due',
          this.formatCurrency(
              pendingDue
          )
      );

      this.renderCustomerTransactions(
          data.transactions || []
      );

      this.renderCustomerPaymentArea(
          customer,
          pendingDue
      );

    } catch (err) {

      console.error(
          'Customer dashboard error:',
          err
      );
    }
  },

  // =========================================================
  // CUSTOMER TRANSACTIONS
  // =========================================================

  renderCustomerTransactions(
      transactions
  ) {

    const tbody =
        document.getElementById(
            'cust-statement-table-body'
        ) ||
        document.getElementById(
            'cp-txn-table'
        );

    if (!tbody) {
      return;
    }

    tbody.innerHTML = '';

    if (
        !Array.isArray(
            transactions
        ) ||
        transactions.length === 0
    ) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="5"
            style="text-align:center;"
          >
            No transactions found.
          </td>
        </tr>
      `;

      return;
    }

    transactions.forEach(
        transaction => {

          const tr =
              document.createElement(
                  'tr'
              );

          tr.innerHTML = `

          <td>
            ${this.escapeHtml(
              transaction.type ||
              transaction.transactionType ||
              '-'
          )}
          </td>

          <td>
            ₹${this.formatCurrency(
              transaction.amount
          )}
          </td>

          <td>
            ${this.escapeHtml(
              transaction.description ||
              '-'
          )}
          </td>

          <td>
            ${this.escapeHtml(
              transaction.createdAt ||
              transaction.date ||
              '-'
          )}
          </td>

        `;

          tbody.appendChild(
              tr
          );
        }
    );
  },

  // =========================================================
  // CUSTOMER PAYMENT AREA
  // =========================================================

  renderCustomerPaymentArea(
      customer,
      due
  ) {

    const area =
        document.getElementById(
            'cust-pay-container'
        ) ||
        document.getElementById(
            'cp-pay-area'
        );

    if (!area) {
      return;
    }

    if (due <= 0) {

      area.innerHTML = `
        <div class="payment-success">
          <strong>
            No outstanding due.
          </strong>

          <p>
            Your account is settled.
          </p>
        </div>
      `;

      return;
    }

    area.innerHTML = `

      <div class="payment-box">

        <div>

          <strong>
            Outstanding Due
          </strong>

          <div class="payment-due">
            ${this.formatCurrency(
        due
    )}
          </div>

        </div>

        <button
          class="btn btn-success"
          onclick="
            App.triggerCustomerOnlinePayment(
              ${customer.id},
              ${due}
            )
          "
        >
          Pay Online
        </button>

      </div>
    `;
  },

  // =========================================================
  // RAZORPAY
  // =========================================================

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
          typeof Razorpay ===
          'undefined'
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
            order.currency ||
            'INR',

        name:
            'DueTracker',

        description:
            'Due Payment',

        order_id:
            order.orderId ||
            order.id,

        handler:
            async paymentResponse => {

              try {

                await DueTrackerAPI
                    .recordPayment(
                        customerId,
                        amount,
                        'Online Payment',
                        paymentResponse
                            .razorpay_payment_id
                    );

                alert(
                    'Payment successful and recorded.'
                );

                await this
                    .refreshCustomerDashboard(
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
              this.currentUser
                  ?.data
                  ?.name || ''
        },

        theme: {

          color:
              '#22c55e'
        }
      };

      const razorpay =
          new Razorpay(
              options
          );

      razorpay.open();

    } catch (err) {

      console.error(
          'Online payment error:',
          err
      );

      alert(
          err.message ||
          'Unable to start payment.'
      );
    }
  },

  // =========================================================
  // MODALS
  // =========================================================

  openModal(modalId) {

    const modal =
        document.getElementById(
            modalId
        );

    if (!modal) {

      console.error(
          'Modal not found:',
          modalId
      );

      return;
    }

    modal.classList.add(
        'open',
        'active'
    );

    modal.style.display =
        'flex';
  },

  closeModal(modalId) {

    const modal =
        document.getElementById(
            modalId
        );

    if (!modal) {
      return;
    }

    modal.classList.remove(
        'open',
        'active'
    );

    modal.style.display =
        'none';
  },

  closeModals() {

    document
        .querySelectorAll(
            '.overlay, .modal-overlay'
        )
        .forEach(modal => {

          modal.classList.remove(
              'open',
              'active'
          );

          modal.style.display =
              'none';
        });
  },

  // =========================================================
  // HELPERS
  // =========================================================

  showAlert(
      element,
      message,
      type = 'error'
  ) {

    if (!element) {
      return;
    }

    element.innerHTML = `
      <div
        class="alert alert-${type}"
      >
        ${this.escapeHtml(
        message
    )}
      </div>
    `;

    element.style.display =
        'block';
  },

  getValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
      return '';
    }

    return String(
        element.value || ''
    ).trim();
  },

  setValue(
      id,
      value
  ) {

    const element =
        document.getElementById(id);

    if (element) {

      element.value =
          value ?? '';
    }
  },

  setText(
      id,
      value
  ) {

    const element =
        document.getElementById(id);

    if (element) {

      element.innerText =
          value ?? '';
    }
  },

  formatCurrency(value) {

    const number =
        Number(value || 0);

    return new Intl.NumberFormat(
        'en-IN',
        {
          maximumFractionDigits: 2
        }
    ).format(number);
  },

  escapeHtml(value) {

    return String(
        value ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
  },

  escape(value) {
    return this.escapeHtml(value);
  }
};


// =========================================================
// COMPATIBILITY ALIASES
// =========================================================

window.DueTrackerApp.togglePw =
    function (
        inputId,
        btnEl
    ) {

      return this.togglePassword(
          inputId,
          btnEl
      );
    };


window.DueTrackerApp.sellerMode =
    function (mode) {

      return this.toggleSellerAuthMode(
          mode
      );
    };


window.DueTrackerApp.refreshDash =
    function () {

      return this.refreshSellerDashboard();
    };


// =========================================================
// GLOBAL APP OBJECT
// =========================================================

window.App =
    window.DueTrackerApp;


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

      window.DueTrackerApp.init();

    }
);