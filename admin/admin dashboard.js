   <script>
        // API Configuration
        //const API_BASE_URL = 'https://princess-sultana-beauty-shop-online.onrender.com/api';
        const API_BASE_URL = 'http://localhost:5000/api';
        
        // API Endpoints
        const API_ENDPOINTS = {
            LOGIN: '/auth/login',
            REGISTER: '/admin/register',
            STATS: '/admin/stats',
            ORDERS: '/commands',
            PRODUCTS: '/products',
            PROFILE: '/admin/profile',
            TICKETS: '/admin/tickets',
            COMMENTS: '/admin/comments',
            CHANGE_PASSWORD: '/admin/change-password',
            LOGO: '/admin/logo',
            REPORTS: '/admin/reports',
            CUSTOMERS: '/admin/customers'
        };

        // Chart instances
        let revenueChart = null;
        let orderStatusChart = null;
        let topProductsChart = null;
        let monthlySalesChart = null;

        // Generic function for authenticated API requests
        async function makeAuthenticatedRequest(url, options = {}) {
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                console.error('❌ No authentication token found');
                redirectToLogin();
                throw new Error('No authentication token found');
            }
            
            const defaultOptions = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            try {
                console.log(`🔍 Making request to: ${API_BASE_URL}${url}`);
                const response = await fetch(`${API_BASE_URL}${url}`, mergedOptions);
                
                if (response.status === 401) {
                    console.error('❌ Unauthorized - token expired or invalid');
                    redirectToLogin();
                    throw new Error('Authentication required');
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ HTTP ${response.status}: ${errorText}`);
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('❌ API request failed:', error);
                throw error;
            }
        }

        function redirectToLogin() {
            console.log('🔒 Redirecting to login...');
            localStorage.removeItem('adminToken');
            window.location.href = 'Admin-Auth.html';
        }

        // Panel switching functionality
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.id === 'logout-btn') return;
                
                e.preventDefault();
                
                // Remove active class from all links
                document.querySelectorAll('.sidebar-menu a').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Hide all panels
                document.querySelectorAll('.content-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                
                // Show the selected panel
                const panelId = this.getAttribute('data-panel');
                document.getElementById(panelId).classList.add('active');
                
                // Load data for the selected panel
                loadPanelData(panelId);
            });
        });

        // Order filter functionality
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const status = this.getAttribute('data-status');
                loadOrders(status);
            });
        });

        // Product form submission
        document.getElementById('productForm').addEventListener('submit', function(e) {
            e.preventDefault();
            addProduct();
        });

        // Settings buttons
        document.getElementById('updateProfileBtn').addEventListener('click', updateProfile);
        document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
        document.getElementById('updateLogoBtn').addEventListener('click', updateLogo);

        // Logout functionality
        document.getElementById('logout-btn').addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('adminToken');
            redirectToLogin();
        });

        // Close modal when clicking the X button
        document.querySelector('#orderDetailsModal .close').addEventListener('click', closeOrderModal);

        // Close modal when clicking outside
        document.getElementById('orderDetailsModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeOrderModal();
            }
        });

        // Load data for a specific panel
        async function loadPanelData(panelId) {
            switch(panelId) {
                case 'dashboard':
                    await loadDashboardData();
                    break;
                case 'product-management':
                    await loadProducts();
                    break;
                case 'order-tracking':
                    await loadOrders('all');
                    break;
                case 'customer-care':
                    await loadTickets();
                    await loadComments();
                    break;
                case 'reports':
                    initReportsPanel();
                    break;
                case 'settings':
                    await loadAdminSettings();
                    break;
            }
        }

        // Load dashboard statistics
        async function loadDashboardData() {
            try {
                const data = await makeAuthenticatedRequest(API_ENDPOINTS.STATS);
                
                // Update dashboard cards
                document.getElementById('total-orders').textContent = data.totalOrders || '0';
                document.getElementById('total-users').textContent = data.totalUsers || '0';
                document.getElementById('total-revenue').textContent = data.totalRevenue ? `${data.totalRevenue} XAF` : '0 XAF';
                document.getElementById('total-products').textContent = data.totalProducts || '0';
                
                // Load recent orders
                await loadRecentOrders();
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                showError('Failed to load dashboard data: ' + error.message);
            }
        }

        // Load recent orders for dashboard
        async function loadRecentOrders() {
            try {
                const response = await makeAuthenticatedRequest('/commands');
                const orders = response.orders || response.commands || response.data || [];
                const container = document.getElementById('recent-orders-container');
                
                // Get only recent orders (last 5)
                const recentOrders = orders.slice(0, 5);
                
                if (recentOrders.length === 0) {
                    container.innerHTML = '<div class="no-data">No recent orders</div>';
                    return;
                }
                
                container.innerHTML = recentOrders.map(order => {
                    const orderData = order.order || order;
                    const customerName = orderData.userId?.name || orderData.user?.name || orderData.customerName || 'Customer';
                    const amount = orderData.amount || orderData.totalAmount || 0;
                    const itemCount = orderData.items?.length || orderData.products?.length || 0;
                    const orderId = orderData._id || order._id;
                    
                    return `
                        <div class="order-card">
                            <div class="order-header">
                                <div class="order-id">Order #${orderData.orderNumber || orderData._id}</div>
                                <div class="order-date">${formatDate(orderData.createdAt)}</div>
                            </div>
                            <div class="order-details">
                                <div>
                                    <strong>Customer:</strong> ${customerName}<br>
                                    <strong>Items:</strong> ${itemCount} products
                                </div>
                                <div>
                                    <strong>Amount:</strong> ${amount.toLocaleString()} XAF<br>
                                    <strong>Payment:</strong> ${orderData.paymentMethod || 'WhatsApp'}
                                </div>
                                <div>
                                    <span class="order-status status-${orderData.status}">${orderData.status}</span>
                                </div>
                            </div>
                            <div class="order-actions">
                                <button class="btn btn-primary" onclick="viewOrderDetails('${orderId}')">View Details</button>
                                <button class="btn btn-secondary" onclick="updateOrderStatus('${orderId}', '${orderData.status}')">Update Status</button>
                            </div>
                        </div>
                    `;
                }).join('');
            } catch (error) {
                console.error('Error loading recent orders:', error);
                document.getElementById('recent-orders-container').innerHTML = 
                    '<div class="error-message">Failed to load recent orders: ' + error.message + '</div>';
            }
        }

        // Load all orders with optional status filter
        async function loadOrders(status = 'all') {
            try {
                const url = status === 'all' 
                    ? '/commands'
                    : `/commands?status=${status}`;
                
                const response = await makeAuthenticatedRequest(url);
                const orders = response.orders || response.commands || response.data || [];
                const container = document.getElementById('orders-container');
                
                if (!orders || orders.length === 0) {
                    container.innerHTML = '<div class="no-data">No orders found</div>';
                    return;
                }
                
                container.innerHTML = orders.map(order => {
                    const orderData = order.order || order;
                    const orderNumber = orderData.orderNumber || orderData._id || 'N/A';
                    const customerName = orderData.userId?.name || orderData.user?.name || orderData.customerName || 'N/A';
                    const customerEmail = orderData.userId?.email || orderData.user?.email || 'N/A';
                    const amount = orderData.amount || orderData.totalAmount || 0;
                    const itemCount = orderData.items?.length || orderData.products?.length || 0;
                    const paymentMethod = orderData.paymentMethod || 'WhatsApp';
                    const address = orderData.shippingAddress?.address || orderData.address || 'N/A';
                    const orderId = orderData._id || order._id;
                    
                    return `
                        <div class="order-card">
                            <div class="order-header">
                                <div class="order-id">Order #${orderNumber}</div>
                                <div class="order-date">${formatDate(orderData.createdAt)}</div>
                            </div>
                            <div class="order-details">
                                <div>
                                    <strong>Customer:</strong> ${customerName}<br>
                                    <strong>Email:</strong> ${customerEmail}<br>
                                    <strong>Items:</strong> ${itemCount} items<br>
                                    <strong>Payment:</strong> ${paymentMethod}
                                </div>
                                <div>
                                    <strong>Amount:</strong> ${amount.toLocaleString()} XAF<br>
                                    <strong>Status:</strong> ${orderData.status}<br>
                                    <strong>Address:</strong> ${address}
                                </div>
                                <div>
                                    <span class="order-status status-${orderData.status}">${orderData.status}</span><br>
                                    <strong>Last Updated:</strong> ${formatDate(orderData.updatedAt || orderData.createdAt)}
                                </div>
                            </div>
                            <div class="order-actions">
                                <button class="btn btn-primary" onclick="viewOrderDetails('${orderId}')">View Details</button>
                                <button class="btn btn-success" onclick="updateOrderStatus('${orderId}', 'processing')">Processing</button>
                                <button class="btn btn-primary" onclick="updateOrderStatus('${orderId}', 'shipped')">Shipped</button>
                                <button class="btn btn-success" onclick="updateOrderStatus('${orderId}', 'delivered')">Delivered</button>
                                <button class="btn btn-danger" onclick="updateOrderStatus('${orderId}', 'cancelled')">Cancel</button>
                            </div>
                        </div>
                    `;
                }).join('');
            } catch (error) {
                console.error('Error loading orders:', error);
                document.getElementById('orders-container').innerHTML = 
                    '<div class="error-message">Failed to load orders: ' + error.message + '</div>';
            }
        }

        // Enhanced view order details function for admin
        async function viewOrderDetails(orderId) {
            try {
                console.log('🔍 Fetching order details for:', orderId);
                
                const order = await makeAuthenticatedRequest(`/commands/${orderId}`);
                console.log('📦 Order data received:', order);
                
                // Safely extract data with proper fallbacks
                const orderData = order.order || order.data || order;
                
                // Order Information
                const orderNumber = orderData.orderNumber || orderData._id || 'N/A';
                const orderDate = orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString() : 'Invalid Date';
                const totalAmount = orderData.amount || orderData.totalAmount || 0;
                const paymentMethod = orderData.paymentMethod || 'WhatsApp';
                const status = orderData.status || 'unknown';
                
                // Customer Information - Check multiple possible locations
                let customerName = 'N/A';
                let customerEmail = 'N/A';
                let customerPhone = 'N/A';
                
                if (orderData.userId) {
                    customerName = orderData.userId.name || orderData.userId.fullName || 'N/A';
                    customerEmail = orderData.userId.email || 'N/A';
                    customerPhone = orderData.userId.phone || 'N/A';
                } else if (orderData.user) {
                    customerName = orderData.user.name || orderData.user.fullName || 'N/A';
                    customerEmail = orderData.user.email || 'N/A';
                    customerPhone = orderData.user.phone || 'N/A';
                } else if (orderData.customer) {
                    customerName = orderData.customer.name || orderData.customer.fullName || 'N/A';
                    customerEmail = orderData.customer.email || 'N/A';
                    customerPhone = orderData.customer.phone || 'N/A';
                }
                
                // Shipping Address
                let shippingAddress = 'No shipping address provided';
                if (orderData.shippingAddress) {
                    const addr = orderData.shippingAddress;
                    shippingAddress = `
                        ${addr.fullName ? `<strong>${addr.fullName}</strong><br>` : ''}
                        ${addr.address || ''}<br>
                        ${addr.city ? `${addr.city}, ` : ''}${addr.state || ''} ${addr.postalCode || ''}<br>
                        ${addr.country || ''}<br>
                        ${addr.phone ? `Phone: ${addr.phone}` : ''}
                    `;
                } else if (orderData.address) {
                    shippingAddress = orderData.address;
                }
                
                // Order Items
                let orderItemsHTML = 'No items found';
                const items = orderData.items || orderData.products || [];
                
                if (items.length > 0) {
                    orderItemsHTML = `
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="background: var(--light-gray);">
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
                                    <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Quantity</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => {
                                    const itemName = item.name || item.productId?.name || 'Product';
                                    const quantity = item.quantity || 1;
                                    const price = item.price || item.unitPrice || 0;
                                    const total = quantity * price;
                                    
                                    return `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 10px;">${itemName}</td>
                                            <td style="padding: 10px; text-align: center;">${quantity}</td>
                                            <td style="padding: 10px; text-align: right;">${price.toLocaleString()} XAF</td>
                                            <td style="padding: 10px; text-align: right;">${total.toLocaleString()} XAF</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background: var(--off-white);">
                                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold;">${totalAmount.toLocaleString()} XAF</td>
                                </tr>
                            </tfoot>
                        </table>
                    `;
                }
                
                // Order Timeline
                const timelineHTML = `
                    <div style="margin-bottom: 8px;">• Created: ${orderData.createdAt ? new Date(orderData.createdAt).toLocaleString() : 'Invalid Date'}</div>
                    ${orderData.updatedAt && orderData.updatedAt !== orderData.createdAt ? 
                        `<div style="margin-bottom: 8px;">• Last Updated: ${new Date(orderData.updatedAt).toLocaleString()}</div>` : ''}
                    <div style="margin-bottom: 8px;">• Current Status: <strong>${status}</strong></div>
                `;
                
                // Update modal content
                document.getElementById('modalOrderTitle').textContent = `Order #${orderNumber}`;
                document.getElementById('modalOrderNumber').textContent = orderNumber;
                document.getElementById('modalOrderDate').textContent = orderDate;
                document.getElementById('modalOrderAmount').textContent = `${totalAmount.toLocaleString()} XAF`;
                document.getElementById('modalPaymentMethod').textContent = paymentMethod;
                
                // Customer info
                document.getElementById('modalCustomerName').textContent = customerName;
                document.getElementById('modalCustomerEmail').textContent = customerEmail;
                document.getElementById('modalCustomerPhone').textContent = customerPhone;
                
                // Shipping address
                document.getElementById('modalShippingAddress').innerHTML = shippingAddress;
                
                // Order items
                document.getElementById('modalOrderItems').innerHTML = orderItemsHTML;
                
                // Order status
                const statusElement = document.getElementById('modalOrderStatus');
                statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
                statusElement.className = `order-status status-${status}`;
                
                // Order timeline
                document.getElementById('modalOrderTimeline').innerHTML = timelineHTML;
                
                // Show modal
                document.getElementById('orderDetailsModal').style.display = 'flex';
                
            } catch (error) {
                console.error('❌ Error loading order details:', error);
                showError('Failed to load order details: ' + error.message);
                
                // Show error state in modal
                document.getElementById('modalOrderTitle').textContent = 'Error Loading Order';
                document.getElementById('modalOrderItems').innerHTML = '<div style="color: var(--red); text-align: center; padding: 20px;">Failed to load order details. Please try again.</div>';
                document.getElementById('orderDetailsModal').style.display = 'flex';
            }
        }

        // Update order status function for admin
        async function updateOrderStatus(orderId, status) {
            if (!confirm(`Are you sure you want to change this order status to "${status}"?`)) {
                return;
            }

            try {
                const response = await makeAuthenticatedRequest(`/commands/${orderId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status })
                });
                
                if (response.success) {
                    showSuccess(`Order status updated to ${status} successfully`);
                    
                    // If order was canceled, reset dashboard statistics
                    if (status === 'cancelled') {
                        await resetDashboardForCanceledCommands();
                    } else {
                        // Refresh the current view for other status changes
                        const activePanel = document.querySelector('.content-panel.active').id;
                        if (activePanel === 'dashboard') {
                            await loadRecentOrders();
                        } else if (activePanel === 'order-tracking') {
                            const currentFilter = document.querySelector('.filter-btn.active').getAttribute('data-status');
                            await loadOrders(currentFilter);
                        }
                    }
                } else {
                    throw new Error(response.message || 'Failed to update order status');
                }
            } catch (error) {
                console.error('Error updating order status:', error);
                showError('Failed to update order status: ' + error.message);
            }
        }

        // Load support tickets
        async function loadTickets() {
            try {
                const tickets = await makeAuthenticatedRequest(API_ENDPOINTS.TICKETS);
                const container = document.getElementById('tickets-container');
                
                if (tickets.length === 0) {
                    container.innerHTML = '<div class="no-data">No support tickets</div>';
                    return;
                }
                
                container.innerHTML = tickets.map(ticket => `
                    <div class="ticket">
                        <div class="ticket-header">
                            <div class="ticket-subject">${ticket.subject}</div>
                            <div class="ticket-date">${formatDate(ticket.createdAt)}</div>
                        </div>
                        <div class="ticket-meta">
                            <div class="ticket-customer">${ticket.customerName}</div>
                            <div class="ticket-priority priority-${ticket.priority}">${ticket.priority}</div>
                            <div class="ticket-status">${ticket.status}</div>
                        </div>
                        <div class="ticket-message">
                            ${ticket.message}
                        </div>
                        <div class="ticket-actions">
                            <button class="btn btn-primary" onclick="replyToTicket('${ticket.id}')">Reply</button>
                            <button class="btn btn-secondary" onclick="closeTicket('${ticket.id}')">Close</button>
                            <button class="btn btn-success" onclick="publishComment('${ticket.id}')">Publish</button>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading tickets:', error);
                document.getElementById('tickets-container').innerHTML = '<div class="error-message">Failed to load support tickets</div>';
            }
        }

        // Load customer comments
        async function loadComments() {
            try {
                const comments = await makeAuthenticatedRequest(API_ENDPOINTS.COMMENTS);
                const container = document.getElementById('comments-container');
                
                if (comments.length === 0) {
                    container.innerHTML = '<div class="no-data">No customer comments</div>';
                    return;
                }
                
                container.innerHTML = comments.map(comment => `
                    <div class="ticket">
                        <div class="ticket-header">
                            <div class="ticket-subject">${comment.title}</div>
                            <div class="ticket-date">${formatDate(comment.createdAt)}</div>
                        </div>
                        <div class="ticket-meta">
                            <div class="ticket-customer">${comment.customerName}</div>
                            <div class="ticket-rating">Rating: ${comment.rating}/5</div>
                        </div>
                        <div class="ticket-message">
                            ${comment.content}
                        </div>
                        <div class="ticket-actions">
                            <button class="btn btn-primary" onclick="replyToComment('${comment.id}')">Reply</button>
                            <button class="btn btn-success" onclick="publishComment('${comment.id}')">Publish</button>
                            <button class="btn btn-danger" onclick="deleteComment('${comment.id}')">Delete</button>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading comments:', error);
                document.getElementById('comments-container').innerHTML = '<div class="error-message">Failed to load customer comments</div>';
            }
        }

        // Load products with authentication and image support
        async function loadProducts() {
            try {
                console.log('🔍 Loading products...');
                
                const token = localStorage.getItem('adminToken');
                if (!token) {
                    console.error('❌ No authentication token found');
                    redirectToLogin();
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/products`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        console.error('❌ Authentication failed, redirecting to login');
                        redirectToLogin();
                        return;
                    }
                    throw new Error(`HTTP ${response.status}: Failed to load products`);
                }
                
                const products = await response.json();
                const tbody = document.getElementById('products-table-body');
                
                if (!products || products.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--gray);">No products found. Add your first product above.</td></tr>';
                    return;
                }
                
                tbody.innerHTML = products.map(product => `
                    <tr>
                        <td>
                            <div class="logo-placeholder" style="width: 40px; height: 40px;">
                                ${product.imageURL ? 
                                    `<img src="${product.imageURL.startsWith('/') ? API_BASE_URL + product.imageURL : product.imageURL}" 
                                            alt="${product.name}" 
                                            style="width:100%;height:100%;object-fit:cover;">` : 
                                    '<i class="fas fa-cube"></i>'
                                }
                            </div>
                        </td>
                        <td><strong>${product.name}</strong></td>
                        <td>${product.category || 'N/A'}</td>
                        <td>${product.retailPrice ? `${product.retailPrice} XAF` : 'N/A'}</td>
                        <td>${product.retailQuantity || 0}</td>
                        <td><span class="order-status status-${product.status || 'active'}">${product.status || 'active'}</span></td>
                        <td>
                            <button class="btn btn-primary" onclick="editProduct('${product._id}')">Edit</button>
                            <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
                
            } catch (error) {
                console.error('❌ Error loading products:', error);
                document.getElementById('products-table-body').innerHTML = 
                    '<tr><td colspan="7" style="text-align: center; color: var(--red);">Error loading products: ' + error.message + '</td></tr>';
            }
        }

        // Add a new product with image upload
        async function addProduct() {
            const form = document.getElementById('productForm');
            const formData = new FormData();
            
            // Get form values
            const productName = document.getElementById('productName').value.trim();
            const productDescription = document.getElementById('productDescription').value.trim();
            const productCategory = document.getElementById('productCategory').value;
            const retailPrice = document.getElementById('retailPrice').value;
            const retailQuantity = document.getElementById('retailQuantity').value;
            const productStatus = document.getElementById('productStatus').value;
            const wholesalePrice = document.getElementById('wholesalePrice').value;
            const bulkQuantity = document.getElementById('bulkQuantity').value;
            const bulkUnit = document.getElementById('bulkUnit').value.trim();
            const productImage = document.getElementById('productImage').files[0];

            // Basic validation
            if (!productName || !productDescription || !productCategory || !retailPrice) {
                showError('Please fill in all required fields: Name, Description, Category, and Retail Price');
                return;
            }

            if (parseFloat(retailPrice) < 0) {
                showError('Retail price cannot be negative');
                return;
            }

            // Append form data
            formData.append('name', productName);
            formData.append('description', productDescription);
            formData.append('category', productCategory);
            formData.append('retailPrice', retailPrice);
            formData.append('retailQuantity', retailQuantity || '0');
            formData.append('status', productStatus);
            
            if (wholesalePrice) formData.append('wholesalePrice', wholesalePrice);
            if (bulkQuantity) formData.append('bulkQuantity', bulkQuantity);
            if (bulkUnit) formData.append('bulkUnit', bulkUnit);
            if (productImage) formData.append('images', productImage);

            try {
                console.log('📦 Sending product data with image...');
                
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${API_BASE_URL}/admin/products`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || `HTTP ${response.status}: Failed to add product`);
                }

                if (!result.success) {
                    throw new Error(result.error || 'Failed to add product');
                }

                showSuccess('Product added successfully!');
                form.reset();
                
                // Refresh products list
                setTimeout(() => {
                    loadProducts();
                }, 1000);
                
            } catch (error) {
                console.error('❌ Error adding product:', error);
                showError('Failed to add product: ' + error.message);
            }
        }

        // Delete product function
        async function deleteProduct(productId) {
            if (!confirm('Are you sure you want to delete this product?')) {
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'Failed to delete product');
                }

                showSuccess('Product deleted successfully!');
                loadProducts(); // Refresh the list
                
            } catch (error) {
                console.error('Error deleting product:', error);
                showError('Failed to delete product: ' + error.message);
            }
        }

        // Load admin settings
        async function loadAdminSettings() {
            try {
                const profile = await makeAuthenticatedRequest(API_ENDPOINTS.PROFILE);

                // Update form fields
                document.getElementById('adminName').value = profile.name || '';
                document.getElementById('adminEmail').value = profile.email || '';
                document.getElementById('adminPhone').value = profile.phone || '';
                
                // Update admin name in header
                document.getElementById('admin-name').textContent = profile.name || 'Admin';
                
                // Update logo if available
                if (profile.companyLogo) {
                    const logoPlaceholder = document.getElementById('settingsLogoPlaceholder');
                    logoPlaceholder.innerHTML = `<img src="${profile.companyLogo}" alt="Company Logo">`;
                }
            } catch (error) {
                console.error('Error loading admin settings:', error);
                showError('Failed to load admin settings');
            }
        }

        // Update admin profile function
        async function updateProfile() {
            try {
                const name = document.getElementById('adminName').value;
                const email = document.getElementById('adminEmail').value;
                const phone = document.getElementById('adminPhone').value;
                
                const response = await makeAuthenticatedRequest(API_ENDPOINTS.PROFILE, {
                    method: 'PUT',
                    body: JSON.stringify({ name, email, phone })
                });
                
                if (response.success) {
                    showSuccess('Profile updated successfully!');
                    document.getElementById('admin-name').textContent = name;
                } else {
                    throw new Error(response.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showError('Failed to update profile: ' + error.message);
            }
        }

        // Change admin password
        async function changePassword() {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                showError('New passwords do not match');
                return;
            }
            
            try {
                await makeAuthenticatedRequest(API_ENDPOINTS.CHANGE_PASSWORD, {
                    method: 'POST',
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                
                showSuccess('Password changed successfully');
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } catch (error) {
                console.error('Error changing password:', error);
                showError('Failed to change password');
            }
        }

        // Update company logo
        async function updateLogo() {
            const logoInput = document.getElementById('companyLogo');
            if (!logoInput.files.length) {
                showError('Please select a logo file');
                return;
            }
            
            const formData = new FormData();
            formData.append('logo', logoInput.files[0]);
            
            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGO}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                if (!response.ok) throw new Error('Failed to update logo');
                
                const result = await response.json();
                showSuccess('Logo updated successfully');
                
                // Update logo placeholders
                const logoUrl = result.logoUrl;
                document.getElementById('logoPlaceholder').innerHTML = `<img src="${logoUrl}" alt="Company Logo">`;
                document.getElementById('settingsLogoPlaceholder').innerHTML = `<img src="${logoUrl}" alt="Company Logo">`;
            } catch (error) {
                console.error('Error updating logo:', error);
                showError('Failed to update logo');
            }
        }

        // Function to reset dashboard statistics when commands are canceled
        async function resetDashboardForCanceledCommands() {
            try {
                console.log('🔄 Resetting dashboard for canceled commands...');
                
                // Show loading state
                document.getElementById('total-orders').innerHTML = '<div class="loading-spinner"></div>';
                document.getElementById('total-revenue').innerHTML = '<div class="loading-spinner"></div>';
                
                // Get current statistics
                const stats = await makeAuthenticatedRequest(API_ENDPOINTS.STATS);
                
                // Calculate canceled orders count and revenue impact
                const canceledOrdersResponse = await makeAuthenticatedRequest('/commands?status=cancelled');
                const canceledOrders = canceledOrdersResponse.orders || canceledOrdersResponse.commands || [];
                
                const canceledCount = canceledOrders.length;
                const canceledRevenue = canceledOrders.reduce((total, order) => {
                    return total + (order.amount || order.totalAmount || 0);
                }, 0);
                
                // Update dashboard with corrected values (excluding canceled orders)
                const adjustedOrders = (stats.totalOrders || 0) - canceledCount;
                const adjustedRevenue = (stats.totalRevenue || 0) - canceledRevenue;
                
                // Update the dashboard display
                document.getElementById('total-orders').textContent = adjustedOrders;
                document.getElementById('total-revenue').textContent = `${adjustedRevenue.toLocaleString()} XAF`;
                
                // Show notification about the adjustment
                if (canceledCount > 0) {
                    showSuccess(`Dashboard updated: ${canceledCount} canceled orders excluded (${canceledRevenue.toLocaleString()} XAF)`);
                }
                
                // Refresh the recent orders display to remove canceled ones
                await loadRecentOrders();
                
                // Update the canceled orders tracking section
                updateCanceledOrdersTracking(canceledOrders);
                
            } catch (error) {
                console.error('❌ Error resetting dashboard:', error);
                showError('Failed to reset dashboard: ' + error.message);
                
                // Fallback: reload the entire dashboard
                await loadDashboardData();
            }
        }

        // Function to delete a single canceled order
        async function deleteCanceledOrder(orderId, event) {
            if (!confirm('Are you sure you want to permanently delete this canceled order? This action cannot be undone.')) {
                return;
            }

            try {
                // Show loading state
                let deleteBtn;
                if (event && event.target) {
                    deleteBtn = event.target.closest('button');
                } else {
                    deleteBtn = document.querySelector(`button[onclick*="${orderId}"]`);
                }

                if (deleteBtn) {
                    const originalText = deleteBtn.innerHTML;
                    deleteBtn.innerHTML = '<div class="loading-spinner"></div>';
                    deleteBtn.disabled = true;
                }

                // Try the DELETE endpoint first
                let response;
                try {
                    response = await makeAuthenticatedRequest(`/commands/${orderId}`, {
                        method: 'DELETE'
                    });
                } catch (deleteError) {
                    // If DELETE fails, try updating status to 'deleted' instead
                    console.log('DELETE endpoint not available, trying status update...');
                    response = await makeAuthenticatedRequest(`/commands/${orderId}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: 'deleted' })
                    });
                }
                
                if (response.success) {
                    showSuccess('Canceled order deleted successfully!');
                    
                    // Reset dashboard to reflect the change
                    await resetDashboardForCanceledCommands();
                } else {
                    throw new Error(response.message || 'Failed to delete order');
                }
            } catch (error) {
                console.error('Error deleting canceled order:', error);
                showError('Failed to delete canceled order: ' + error.message);
                
                // Reset button state if possible
                if (deleteBtn) {
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
                    deleteBtn.disabled = false;
                }
            }
        }

        // Function to delete all canceled orders
        async function deleteAllCanceledOrders() {
            try {
                // Get all canceled orders first
                const canceledOrdersResponse = await makeAuthenticatedRequest('/commands?status=cancelled');
                const canceledOrders = canceledOrdersResponse.orders || canceledOrdersResponse.commands || [];
                
                if (canceledOrders.length === 0) {
                    showError('No canceled orders to delete');
                    return;
                }

                if (!confirm(`Are you sure you want to permanently delete ALL ${canceledOrders.length} canceled orders? This action cannot be undone.`)) {
                    return;
                }

                // Show loading state
                const deleteAllBtn = document.getElementById('deleteAllBtn');
                const originalText = deleteAllBtn.innerHTML;
                deleteAllBtn.innerHTML = '<div class="loading-spinner"></div> Deleting...';
                deleteAllBtn.disabled = true;

                let successCount = 0;
                let errorCount = 0;

                // Delete orders one by one
                for (const order of canceledOrders) {
                    try {
                        await makeAuthenticatedRequest(`/commands/${order._id}`, {
                            method: 'DELETE'
                        });
                        successCount++;
                    } catch (error) {
                        console.error(`Failed to delete order ${order._id}:`, error);
                        errorCount++;
                    }
                }

                // Reset button state
                deleteAllBtn.innerHTML = originalText;
                deleteAllBtn.disabled = false;

                if (errorCount === 0) {
                    showSuccess(`Successfully deleted all ${successCount} canceled orders!`);
                } else {
                    showSuccess(`Deleted ${successCount} orders. ${errorCount} orders failed to delete.`);
                }

                // Reset dashboard to reflect the changes
                await resetDashboardForCanceledCommands();

            } catch (error) {
                console.error('Error deleting all canceled orders:', error);
                showError('Failed to delete canceled orders: ' + error.message);
                
                // Reset button state
                const deleteAllBtn = document.getElementById('deleteAllBtn');
                deleteAllBtn.innerHTML = '<i class="fas fa-trash"></i> Delete All Canceled';
                deleteAllBtn.disabled = false;
            }
        }

        // Function to restore a canceled order
        async function restoreOrder(orderId) {
            if (!confirm('Are you sure you want to restore this canceled order?')) {
                return;
            }

            try {
                const response = await makeAuthenticatedRequest(`/commands/${orderId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'processing' })
                });
                
                if (response.success) {
                    showSuccess('Order restored successfully!');
                    
                    // Reset dashboard to reflect the change
                    await resetDashboardForCanceledCommands();
                } else {
                    throw new Error(response.message || 'Failed to restore order');
                }
            } catch (error) {
                console.error('Error restoring order:', error);
                showError('Failed to restore order: ' + error.message);
            }
        }

        // Initialize date inputs for reports
        function initDateInputs() {
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            document.getElementById('startDate').value = lastMonth.toISOString().split('T')[0];
            document.getElementById('endDate').value = today.toISOString().split('T')[0];
        }

        // Set report type
        function setReportType(type) {
            // Update active button
            document.querySelectorAll('.report-type-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Calculate dates based on type
            const endDate = new Date();
            const startDate = new Date();
            
            switch(type) {
                case 'daily':
                    startDate.setDate(endDate.getDate() - 1);
                    break;
                case 'weekly':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case 'monthly':
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case 'yearly':
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                case 'custom':
                    // Keep current dates
                    return;
            }
            
            document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
            document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
            
            // Load data with new dates
            loadReportData();
        }

        // Load report data
        async function loadReportData() {
            try {
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                
                // Show loading states
                document.querySelectorAll('.summary-value').forEach(el => {
                    el.textContent = '...';
                });
                
                // Load all data in parallel
                await Promise.all([
                    loadSalesStatistics(startDate, endDate),
                    loadCustomerData(),
                    loadChartData(startDate, endDate)
                ]);
                
            } catch (error) {
                console.error('Error loading report data:', error);
                showError('Failed to load report data: ' + error.message);
            }
        }

        // Load sales statistics
async function loadSalesStatistics(startDate, endDate) {
    try {
        const url = `/admin/reports/sales?start=${startDate}&end=${endDate}`;
        const response = await makeAuthenticatedRequest(url);
        
        // Update summary cards
        document.getElementById('totalRevenueReport').textContent = 
            response.data.summary.totalRevenue ? 
            `${response.data.summary.totalRevenue.toLocaleString()} XAF` : '0 XAF';
        document.getElementById('totalOrdersReport').textContent = 
            response.data.summary.totalOrders || '0';
        document.getElementById('avgOrderValue').textContent = 
            response.data.summary.averageOrderValue ? 
            `${Math.round(response.data.summary.averageOrderValue).toLocaleString()} XAF` : '0 XAF';
        document.getElementById('totalCustomers').textContent = 
            response.data.summary.totalCustomers || '0';
            
    } catch (error) {
        console.error('Error loading sales statistics:', error);
        // Fallback to existing method
        await loadFallbackStatistics();
    }
}

        // Fallback statistics loader
        async function loadFallbackStatistics() {
            try {
                // Get all orders to calculate statistics
                const response = await makeAuthenticatedRequest('/commands');
                const orders = response.orders || response.commands || response.data || [];
                
                // Filter orders by date if dates are set
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                
                let filteredOrders = orders;
                if (startDate && endDate) {
                    filteredOrders = orders.filter(order => {
                        const orderDate = new Date(order.createdAt || order.order?.createdAt);
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999); // Include entire end date
                        return orderDate >= start && orderDate <= end;
                    });
                }
                
                // Calculate statistics
                const totalOrders = filteredOrders.length;
                const totalRevenue = filteredOrders.reduce((sum, order) => {
                    const orderData = order.order || order;
                    return sum + (orderData.amount || orderData.totalAmount || 0);
                }, 0);
                const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                
                // Get unique customers
                const customerSet = new Set();
                filteredOrders.forEach(order => {
                    const orderData = order.order || order;
                    const customerId = orderData.userId?._id || orderData.user?._id;
                    if (customerId) customerSet.add(customerId);
                });
                const totalCustomers = customerSet.size;
                
                // Update summary cards
                document.getElementById('totalRevenueReport').textContent = `${totalRevenue.toLocaleString()} XAF`;
                document.getElementById('totalOrdersReport').textContent = totalOrders.toString();
                document.getElementById('avgOrderValue').textContent = `${Math.round(averageOrderValue).toLocaleString()} XAF`;
                document.getElementById('totalCustomers').textContent = totalCustomers.toString();
                    
            } catch (error) {
                console.error('Error loading fallback statistics:', error);
                showError('Failed to load sales statistics');
            }
        }

        // Load customer data for reports
        async function loadCustomerData() {
            try {
                // Try to get data from customers endpoint first
                const response = await makeAuthenticatedRequest('/admin/customers');
                const customers = response.customers || response.data || [];
                
                // If no customer endpoint, extract from orders
                if (customers.length === 0) {
                    await loadCustomersFromOrders();
                    return;
                }
                
                // Update customer list table
                const tbody = document.getElementById('customerListBody');
                
                if (customers.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; color: var(--gray);">
                                No customer data available
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = customers.map(customer => `
                    <tr>
                        <td>${customer._id?.substring(0, 8) || 'N/A'}</td>
                        <td>${customer.name || customer.fullName || 'N/A'}</td>
                        <td>${customer.email || 'N/A'}</td>
                        <td>${customer.phone || 'N/A'}</td>
                        <td>${customer.totalOrders || 0}</td>
                        <td>${customer.totalSpent ? `${customer.totalSpent.toLocaleString()} XAF` : '0 XAF'}</td>
                        <td>${customer.lastOrder ? formatDate(customer.lastOrder) : 'Never'}</td>
                        <td>
                            <span class="order-status ${customer.isActive ? 'status-delivered' : 'status-cancelled'}">
                                ${customer.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                    </tr>
                `).join('');
                
                // Update top customers list
                updateTopCustomers(customers);
                
            } catch (error) {
                console.error('Error loading customer data:', error);
                // Fallback to loading from orders
                await loadCustomersFromOrders();
            }
        }

        // Load customers from orders data
        async function loadCustomersFromOrders() {
            try {
                const response = await makeAuthenticatedRequest('/commands');
                const orders = response.orders || response.commands || response.data || [];
                
                // Group orders by customer
                const customersMap = new Map();
                
                orders.forEach(order => {
                    const orderData = order.order || order;
                    const customerId = orderData.userId?._id || orderData.user?._id || orderData.customerId;
                    const customerName = orderData.userId?.name || orderData.user?.name || orderData.customerName || 'Unknown Customer';
                    const customerEmail = orderData.userId?.email || orderData.user?.email || 'N/A';
                    const customerPhone = orderData.userId?.phone || orderData.user?.phone || 'N/A';
                    const orderAmount = orderData.amount || orderData.totalAmount || 0;
                    
                    if (!customersMap.has(customerId)) {
                        customersMap.set(customerId, {
                            _id: customerId,
                            name: customerName,
                            email: customerEmail,
                            phone: customerPhone,
                            totalOrders: 0,
                            totalSpent: 0,
                            lastOrder: orderData.createdAt,
                            isActive: true
                        });
                    }
                    
                    const customer = customersMap.get(customerId);
                    customer.totalOrders += 1;
                    customer.totalSpent += orderAmount;
                    
                    // Update last order if this one is newer
                    if (new Date(orderData.createdAt) > new Date(customer.lastOrder)) {
                        customer.lastOrder = orderData.createdAt;
                    }
                });
                
                const customers = Array.from(customersMap.values());
                
                // Update customer list table
                const tbody = document.getElementById('customerListBody');
                
                if (customers.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; color: var(--gray);">
                                No customer data available
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = customers.map(customer => `
                    <tr>
                        <td>${customer._id?.substring(0, 8) || 'N/A'}</td>
                        <td>${customer.name || 'N/A'}</td>
                        <td>${customer.email || 'N/A'}</td>
                        <td>${customer.phone || 'N/A'}</td>
                        <td>${customer.totalOrders || 0}</td>
                        <td>${customer.totalSpent ? `${customer.totalSpent.toLocaleString()} XAF` : '0 XAF'}</td>
                        <td>${customer.lastOrder ? formatDate(customer.lastOrder) : 'Never'}</td>
                        <td>
                            <span class="order-status status-delivered">Active</span>
                        </td>
                    </tr>
                `).join('');
                
                // Update top customers list
                updateTopCustomers(customers);
                
            } catch (error) {
                console.error('Error loading customers from orders:', error);
                document.getElementById('customerListBody').innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; color: var(--red);">
                            Error loading customer data: ${error.message}
                        </td>
                    </tr>
                `;
            }
        }

        // Update top customers list
        function updateTopCustomers(customers) {
            // Sort customers by total spent
            const sortedCustomers = [...customers]
                .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
                .slice(0, 5);
            
            const container = document.getElementById('topCustomersList');
            
            if (sortedCustomers.length === 0) {
                container.innerHTML = '<div class="no-data">No customer data available</div>';
                return;
            }
            
            container.innerHTML = sortedCustomers.map(customer => `
                <div class="customer-item">
                    <div class="customer-name">${customer.name || 'Unknown Customer'}</div>
                    <div class="customer-info">
                        <span class="customer-orders">${customer.totalOrders || 0} orders</span>
                        <span style="margin: 0 10px;">•</span>
                        <span class="customer-spent">${customer.totalSpent ? customer.totalSpent.toLocaleString() : 0} XAF</span>
                    </div>
                </div>
            `).join('');
        }

        // Load chart data
async function loadChartData(startDate, endDate) {
    try {
        const url = `/admin/reports/charts?start=${startDate}&end=${endDate}`;
        const response = await makeAuthenticatedRequest(url);
        
        // Destroy existing charts
        if (revenueChart) revenueChart.destroy();
        if (orderStatusChart) orderStatusChart.destroy();
        if (topProductsChart) topProductsChart.destroy();
        if (monthlySalesChart) monthlySalesChart.destroy();
        
        // Create new charts
        createRevenueChart(response.revenueData || []);
        createOrderStatusChart(response.orderStatusData || []);
        createTopProductsChart(response.topProducts || []);
        createMonthlySalesChart(response.monthlySales || []);
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        createSampleCharts();
    }
}

        // Create revenue chart
        function createRevenueChart(data) {
            const ctx = document.getElementById('revenueChart').getContext('2d');
            
            // If no data provided, create sample data
            if (!data || data.length === 0) {
                data = [
                    { date: 'Jan', revenue: 1500000 },
                    { date: 'Feb', revenue: 1800000 },
                    { date: 'Mar', revenue: 2200000 },
                    { date: 'Apr', revenue: 1900000 },
                    { date: 'May', revenue: 2500000 },
                    { date: 'Jun', revenue: 2800000 }
                ];
            }
            
            const labels = data.map(item => item.date || item.label || item.month);
            const values = data.map(item => item.revenue || item.value || item.sales);
            
            revenueChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Revenue (XAF)',
                        data: values,
                        borderColor: 'rgb(183, 110, 34)',
                        backgroundColor: 'rgba(183, 110, 34, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString() + ' XAF';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Create order status chart
        function createOrderStatusChart(data) {
            const ctx = document.getElementById('orderStatusChart').getContext('2d');
            
            // If no data provided, create sample data
            if (!data || data.length === 0) {
                data = [
                    { status: 'Processing', count: 15 },
                    { status: 'Shipped', count: 25 },
                    { status: 'Delivered', count: 45 },
                    { status: 'Cancelled', count: 5 }
                ];
            }
            
            const labels = data.map(item => item.status);
            const values = data.map(item => item.count);
            const backgroundColors = [
                'rgba(255, 243, 205, 0.8)', // Processing
                'rgba(209, 236, 241, 0.8)', // Shipped
                'rgba(212, 237, 218, 0.8)', // Delivered
                'rgba(248, 215, 218, 0.8)', // Cancelled
                'rgba(226, 227, 229, 0.8)'  // Pending
            ];
            
            orderStatusChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: backgroundColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }

        // Create top products chart
        function createTopProductsChart(data) {
            const ctx = document.getElementById('topProductsChart').getContext('2d');
            
            // If no data provided, create sample data
            if (!data || data.length === 0) {
                data = [
                    { name: 'Hair Oil', sales: 120 },
                    { name: 'Shampoo', sales: 85 },
                    { name: 'Conditioner', sales: 65 },
                    { name: 'Treatment', sales: 45 },
                    { name: 'Styling', sales: 30 }
                ];
            }
            
            const labels = data.map(item => item.name);
            const values = data.map(item => item.sales || item.quantity || item.count);
            
            topProductsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Sales',
                        data: values,
                        backgroundColor: 'rgba(212, 175, 55, 0.8)',
                        borderColor: 'rgb(183, 110, 34)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Create monthly sales chart
        function createMonthlySalesChart(data) {
            const ctx = document.getElementById('monthlySalesChart').getContext('2d');
            
            // If no data provided, create sample data
            if (!data || data.length === 0) {
                data = [
                    { month: 'Jan', sales: 1500000 },
                    { month: 'Feb', sales: 1800000 },
                    { month: 'Mar', sales: 2200000 },
                    { month: 'Apr', sales: 1900000 },
                    { month: 'May', sales: 2500000 },
                    { month: 'Jun', sales: 2800000 }
                ];
            }
            
            const labels = data.map(item => item.month);
            const values = data.map(item => item.sales);
            
            monthlySalesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Sales (XAF)',
                        data: values,
                        backgroundColor: 'rgba(70, 130, 180, 0.8)',
                        borderColor: 'rgb(46, 139, 87)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString() + ' XAF';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Create sample charts for fallback
        function createSampleCharts() {
            // Sample data for demonstration
            const sampleRevenueData = [
                { date: 'Jan', revenue: 1500000 },
                { date: 'Feb', revenue: 1800000 },
                { date: 'Mar', revenue: 2200000 },
                { date: 'Apr', revenue: 1900000 },
                { date: 'May', revenue: 2500000 },
                { date: 'Jun', revenue: 2800000 }
            ];
            
            const sampleStatusData = [
                { status: 'Processing', count: 15 },
                { status: 'Shipped', count: 25 },
                { status: 'Delivered', count: 45 },
                { status: 'Cancelled', count: 5 }
            ];
            
            const sampleProductsData = [
                { name: 'Hair Oil', sales: 120 },
                { name: 'Shampoo', sales: 85 },
                { name: 'Conditioner', sales: 65 },
                { name: 'Treatment', sales: 45 },
                { name: 'Styling', sales: 30 }
            ];
            
            const sampleMonthlyData = [
                { month: 'Jan', sales: 1500000 },
                { month: 'Feb', sales: 1800000 },
                { month: 'Mar', sales: 2200000 },
                { month: 'Apr', sales: 1900000 },
                { month: 'May', sales: 2500000 },
                { month: 'Jun', sales: 2800000 }
            ];
            
            createRevenueChart(sampleRevenueData);
            createOrderStatusChart(sampleStatusData);
            createTopProductsChart(sampleProductsData);
            createMonthlySalesChart(sampleMonthlyData);
        }

        // Refresh customer data
        function refreshCustomerData() {
            loadCustomerData();
            showSuccess('Customer data refreshed successfully');
        }

        // Generate PDF report
        async function generatePDF() {
            try {
                showSuccess('Generating PDF report...');
                
                // Create a new jsPDF instance
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4');
                
                // Add logo
                const logo = document.querySelector('#logoPlaceholder img');
                if (logo) {
                    // In real implementation, you would need to convert image to base64
                }
                
                // Set report title
                const title = `Sultana Hair Care - Sales Report`;
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text(title, 105, 20, { align: 'center' });
                
                // Report date
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
                doc.text(`Date Range: ${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}`, 105, 37, { align: 'center' });
                
                let yPos = 50;
                
                // Summary Section
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Summary Statistics', 20, yPos);
                yPos += 10;
                
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                const summaryData = [
                    ['Total Revenue', document.getElementById('totalRevenueReport').textContent],
                    ['Total Orders', document.getElementById('totalOrdersReport').textContent],
                    ['Average Order Value', document.getElementById('avgOrderValue').textContent],
                    ['Active Customers', document.getElementById('totalCustomers').textContent]
                ];
                
                doc.autoTable({
                    startY: yPos,
                    head: [['Metric', 'Value']],
                    body: summaryData,
                    theme: 'grid',
                    headStyles: { fillColor: [183, 110, 34] },
                    margin: { left: 20, right: 20 }
                });
                
                yPos = doc.lastAutoTable.finalY + 15;
                
                // Top Customers Section
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Top 5 Customers', 20, yPos);
                yPos += 10;
                
                // Get top customers data
                const topCustomersData = [];
                const topCustomersElements = document.querySelectorAll('.customer-item');
                topCustomersElements.forEach((item, index) => {
                    if (index < 5) {
                        const name = item.querySelector('.customer-name').textContent;
                        const orders = item.querySelector('.customer-orders').textContent.replace(' orders', '');
                        const spent = item.querySelector('.customer-spent').textContent;
                        topCustomersData.push([name, orders, spent]);
                    }
                });
                
                if (topCustomersData.length > 0) {
                    doc.autoTable({
                        startY: yPos,
                        head: [['Customer Name', 'Total Orders', 'Total Spent']],
                        body: topCustomersData,
                        theme: 'grid',
                        headStyles: { fillColor: [70, 130, 180] },
                        margin: { left: 20, right: 20 }
                    });
                    
                    yPos = doc.lastAutoTable.finalY + 15;
                }
                
                // Customer List Section (if there's room)
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Customer List (Sample)', 20, yPos);
                yPos += 10;
                
                // Get customer data for PDF
                const customerRows = [];
                const rows = document.querySelectorAll('#customerListBody tr');
                rows.forEach((row, index) => {
                    if (index < 10) { // Limit to 10 customers in PDF
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 5) {
                            customerRows.push([
                                cells[1].textContent.substring(0, 20), // Name (truncated)
                                cells[4].textContent, // Orders
                                cells[5].textContent  // Total Spent
                            ]);
                        }
                    }
                });
                
                if (customerRows.length > 0) {
                    doc.autoTable({
                        startY: yPos,
                        head: [['Customer Name', 'Total Orders', 'Total Spent']],
                        body: customerRows,
                        theme: 'grid',
                        headStyles: { fillColor: [46, 139, 87] },
                        margin: { left: 20, right: 20 },
                        pageBreak: 'auto'
                    });
                }
                
                // Add page number
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFontSize(10);
                    doc.text(`Page ${i} of ${totalPages}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
                }
                
                // Save the PDF
                const fileName = `Sultana_Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                doc.save(fileName);
                
                showSuccess('PDF report generated successfully!');
                
            } catch (error) {
                console.error('Error generating PDF:', error);
                showError('Failed to generate PDF: ' + error.message);
            }
        }

        // Export to Excel
        async function exportToExcel() {
            try {
                // Create CSV content
                let csvContent = "data:text/csv;charset=utf-8,";
                
                // Add headers
                csvContent += "Customer Name,Email,Phone,Total Orders,Total Spent (XAF),Last Order,Status\n";
                
                // Add customer data
                document.querySelectorAll('#customerListBody tr').forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 8) {
                        const rowData = [
                            `"${cells[1].textContent}"`,
                            `"${cells[2].textContent}"`,
                            `"${cells[3].textContent}"`,
                            cells[4].textContent,
                            cells[5].textContent.replace(' XAF', '').replace(',', ''),
                            `"${cells[6].textContent}"`,
                            cells[7].querySelector('span')?.textContent || 'Active'
                        ];
                        csvContent += rowData.join(',') + "\n";
                    }
                });
                
                // Add summary data
                csvContent += "\n\nSummary Statistics\n";
                csvContent += `Total Revenue,${document.getElementById('totalRevenueReport').textContent}\n`;
                csvContent += `Total Orders,${document.getElementById('totalOrdersReport').textContent}\n`;
                csvContent += `Average Order Value,${document.getElementById('avgOrderValue').textContent}\n`;
                csvContent += `Active Customers,${document.getElementById('totalCustomers').textContent}\n`;
                
                // Add date range
                csvContent += `\nDate Range,${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}\n`;
                csvContent += `Report Generated,${new Date().toLocaleDateString()}\n`;
                
                // Create download link
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Sultana_Customer_Report_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                
                // Trigger download
                link.click();
                document.body.removeChild(link);
                
                showSuccess('Excel file exported successfully!');
                
            } catch (error) {
                console.error('Error exporting to Excel:', error);
                showError('Failed to export to Excel: ' + error.message);
            }
        }

        // Show PDF preview
        function showPDFPreview() {
            const preview = document.getElementById('pdfPreview');
            const content = document.getElementById('pdfContent');
            const reportDate = document.getElementById('reportDate');
            
            // Set report date
            reportDate.textContent = new Date().toLocaleDateString();
            
            // Generate preview content
            content.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: var(--dark-brown);">Summary Statistics</h3>
                    <table class="pdf-table">
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                        </tr>
                        <tr>
                            <td>Total Revenue</td>
                            <td>${document.getElementById('totalRevenueReport').textContent}</td>
                        </tr>
                        <tr>
                            <td>Total Orders</td>
                            <td>${document.getElementById('totalOrdersReport').textContent}</td>
                        </tr>
                        <tr>
                            <td>Average Order Value</td>
                            <td>${document.getElementById('avgOrderValue').textContent}</td>
                        </tr>
                        <tr>
                            <td>Active Customers</td>
                            <td>${document.getElementById('totalCustomers').textContent}</td>
                        </tr>
                    </table>
                </div>
                
                <div>
                    <h3 style="color: var(--dark-brown);">Top 5 Customers</h3>
                    <table class="pdf-table">
                        <tr>
                            <th>Name</th>
                            <th>Total Orders</th>
                            <th>Total Spent</th>
                        </tr>
                        ${Array.from(document.querySelectorAll('.customer-item')).slice(0, 5).map(item => {
                            const name = item.querySelector('.customer-name').textContent;
                            const orders = item.querySelector('.customer-orders').textContent;
                            const spent = item.querySelector('.customer-spent').textContent;
                            return `
                                <tr>
                                    <td>${name}</td>
                                    <td>${orders.replace(' orders', '')}</td>
                                    <td>${spent}</td>
                                </tr>
                            `;
                        }).join('')}
                    </table>
                </div>
            `;
            
            // Show preview
            preview.classList.add('active');
        }

        // Initialize reports panel
        function initReportsPanel() {
            initDateInputs();
            loadReportData();
        }

        // Helper functions
        function formatDate(dateString) {
            if (!dateString) return 'Invalid Date';
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }

        function showSuccess(message) {
            const toast = document.createElement('div');
            toast.className = 'toast toast-success';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 3000);
        }

        function showError(message) {
            const toast = document.createElement('div');
            toast.className = 'toast toast-error';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 5000);
        }

        // Close order modal
        function closeOrderModal() {
            document.getElementById('orderDetailsModal').style.display = 'none';
        }

        // Print order details
        function printOrderDetails() {
            window.print();
        }

        // Initialize the dashboard
        async function initializeDashboard() {
            console.log('🚀 Initializing dashboard...');
            
            // Get the token from localStorage (set during login)
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                console.error('❌ No admin token found in localStorage');
                redirectToLogin();
                return;
            }
            
            console.log('🔑 Token found, verifying...');
            
            try {
                // Verify token is valid by making a test request
                await loadDashboardData();
                console.log('✅ Dashboard initialized successfully');
            } catch (error) {
                console.error('❌ Authentication failed:', error);
                redirectToLogin();
            }
        }

        // Enhanced edit product function
        async function editProduct(productId) {
            try {
                console.log('🔍 Loading product data for editing:', productId);
                
                // Show loading state
                const editBtn = document.querySelector(`button[onclick="editProduct('${productId}')"]`);
                const originalText = editBtn.innerHTML;
                editBtn.innerHTML = '<div class="loading-spinner"></div>';
                editBtn.disabled = true;
                
                // Fetch product details
                const product = await makeAuthenticatedRequest(`/products/${productId}`);
                console.log('📦 Product data received:', product);
                
                // Populate the edit form
                document.getElementById('editProductId').value = product._id;
                document.getElementById('editProductName').value = product.name || '';
                document.getElementById('editProductDescription').value = product.description || '';
                document.getElementById('editProductCategory').value = product.category || '';
                document.getElementById('editRetailPrice').value = product.retailPrice || '';
                document.getElementById('editWholesalePrice').value = product.wholesalePrice || '';
                document.getElementById('editRetailQuantity').value = product.retailQuantity || 0;
                document.getElementById('editBulkQuantity').value = product.bulkQuantity || '';
                document.getElementById('editBulkUnit').value = product.bulkUnit || '';
                document.getElementById('editProductStatus').value = product.status || 'active';
                
                // Display current image
                const currentImageContainer = document.getElementById('editCurrentImage');
                if (product.imageURL) {
                    const imageUrl = product.imageURL.startsWith('/') ? API_BASE_URL + product.imageURL : product.imageURL;
                    currentImageContainer.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                            <strong>Current Image:</strong>
                            <img src="${imageUrl}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                        </div>
                    `;
                } else {
                    currentImageContainer.innerHTML = '<div style="color: var(--gray); margin-top: 10px;">No current image</div>';
                }
                
                // Show the modal
                document.getElementById('editProductModal').style.display = 'flex';
                
                // Reset button state
                editBtn.innerHTML = originalText;
                editBtn.disabled = false;
                
            } catch (error) {
                console.error('❌ Error loading product for editing:', error);
                showError('Failed to load product details: ' + error.message);
                
                // Reset button state
                const editBtn = document.querySelector(`button[onclick="editProduct('${productId}')"]`);
                if (editBtn) {
                    editBtn.innerHTML = 'Edit';
                    editBtn.disabled = false;
                }
            }
        }

        // Close edit modal
        function closeEditModal() {
            document.getElementById('editProductModal').style.display = 'none';
            document.getElementById('editProductForm').reset();
            document.getElementById('editCurrentImage').innerHTML = '';
        }

        // Handle edit form submission
        document.getElementById('editProductForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProduct();
        });

        // Update product function
        async function updateProduct() {
            const productId = document.getElementById('editProductId').value;
            const formData = new FormData();
            
            // Get form values
            const productName = document.getElementById('editProductName').value.trim();
            const productDescription = document.getElementById('editProductDescription').value.trim();
            const productCategory = document.getElementById('editProductCategory').value;
            const retailPrice = document.getElementById('editRetailPrice').value;
            const retailQuantity = document.getElementById('editRetailQuantity').value;
            const productStatus = document.getElementById('editProductStatus').value;
            const wholesalePrice = document.getElementById('editWholesalePrice').value;
            const bulkQuantity = document.getElementById('editBulkQuantity').value;
            const bulkUnit = document.getElementById('editBulkUnit').value.trim();
            const productImage = document.getElementById('editProductImage').files[0];

            // Basic validation
            if (!productName || !productDescription || !productCategory || !retailPrice) {
                showError('Please fill in all required fields: Name, Description, Category, and Retail Price');
                return;
            }

            if (parseFloat(retailPrice) < 0) {
                showError('Retail price cannot be negative');
                return;
            }

            // Append form data
            formData.append('name', productName);
            formData.append('description', productDescription);
            formData.append('category', productCategory);
            formData.append('retailPrice', retailPrice);
            formData.append('retailQuantity', retailQuantity || '0');
            formData.append('status', productStatus);
            
            if (wholesalePrice) formData.append('wholesalePrice', wholesalePrice);
            if (bulkQuantity) formData.append('bulkQuantity', bulkQuantity);
            if (bulkUnit) formData.append('bulkUnit', bulkUnit);
            if (productImage) formData.append('images', productImage);

            try {
                console.log('📦 Updating product with ID:', productId);
                
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || `HTTP ${response.status}: Failed to update product`);
                }

                if (!result.success) {
                    throw new Error(result.error || 'Failed to update product');
                }

                showSuccess('Product updated successfully!');
                closeEditModal();
                
                // Refresh products list
                setTimeout(() => {
                    loadProducts();
                }, 1000);
                
            } catch (error) {
                console.error('❌ Error updating product:', error);
                showError('Failed to update product: ' + error.message);
            }
        }

        // Function to update canceled orders tracking with delete buttons
        function updateCanceledOrdersTracking(canceledOrders) {
            const trackingSection = document.getElementById('canceled-orders-tracking');
            const canceledList = document.getElementById('canceled-orders-list');
            
            if (canceledOrders.length === 0) {
                trackingSection.style.display = 'none';
                canceledList.innerHTML = '<div class="no-data">No canceled orders</div>';
                return;
            }
            
            // Show tracking section
            trackingSection.style.display = 'block';
            
            canceledList.innerHTML = canceledOrders.map(order => {
                const orderData = order.order || order;
                const customerName = orderData.userId?.name || orderData.user?.name || orderData.customerName || 'Customer';
                const amount = orderData.amount || orderData.totalAmount || 0;
                const itemCount = orderData.items?.length || orderData.products?.length || 0;
                const orderId = orderData._id || order._id;
                
                return `
                    <div class="order-card" style="border-left: 4px solid var(--red);">
                        <div class="order-header">
                            <div class="order-id">Canceled Order #${orderData.orderNumber || orderData._id}</div>
                            <div class="order-date">${formatDate(orderData.createdAt)}</div>
                        </div>
                        <div class="order-details">
                            <div>
                                <strong>Customer:</strong> ${customerName}<br>
                                <strong>Items:</strong> ${itemCount} products
                            </div>
                            <div>
                                <strong>Amount:</strong> ${amount.toLocaleString()} XAF<br>
                                <strong>Canceled:</strong> ${formatDate(orderData.updatedAt || orderData.createdAt)}
                            </div>
                            <div>
                                <span class="order-status status-cancelled">CANCELED</span>
                            </div>
                        </div>
                        <div class="order-actions">
                            <button class="btn btn-primary" onclick="viewOrderDetails('${orderId}')">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            <button class="btn btn-success" onclick="restoreOrder('${orderId}')">
                                <i class="fas fa-undo"></i> Restore
                            </button>
                            <button class="btn btn-danger" onclick="deleteCanceledOrder('${orderId}', event)">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Function to toggle visibility of canceled orders tracking
        function toggleCanceledOrders() {
            const trackingSection = document.getElementById('canceled-orders-tracking');
            const toggleButton = trackingSection.querySelector('button.btn-secondary');
            
            if (trackingSection.style.display === 'none') {
                trackingSection.style.display = 'block';
                toggleButton.textContent = 'Hide';
            } else {
                trackingSection.style.display = 'none';
                toggleButton.textContent = 'Show Canceled';
            }
        }

        // Add dashboard reset button
        function addDashboardResetButton() {
            const header = document.querySelector('.header');
            if (header.querySelector('.reset-stats-btn')) return;
            
            const resetButton = document.createElement('button');
            resetButton.className = 'btn btn-secondary reset-stats-btn';
            resetButton.innerHTML = '<i class="fas fa-sync-alt"></i> Reset Stats';
            resetButton.onclick = resetDashboardForCanceledCommands;
            resetButton.style.marginLeft = '10px';
            
            header.querySelector('.user-info').parentNode.insertBefore(resetButton, header.querySelector('.user-info'));
        }

        // Initialize the dashboard reset functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Add the reset button to the dashboard
            addDashboardResetButton();
            
            // Set up periodic dashboard refresh (every 5 minutes)
            setInterval(() => {
                const activePanel = document.querySelector('.content-panel.active').id;
                if (activePanel === 'dashboard') {
                    resetDashboardForCanceledCommands();
                }
            }, 300000); // 5 minutes
            
            // Initialize dashboard
            initializeDashboard();
        });

        // Placeholder functions for ticket and comment management
        function replyToTicket(ticketId) {
            showSuccess(`Reply to ticket ${ticketId} - Feature coming soon`);
        }

        function closeTicket(ticketId) {
            showSuccess(`Close ticket ${ticketId} - Feature coming soon`);
        }

        function publishComment(commentId) {
            showSuccess(`Publish comment ${commentId} - Feature coming soon`);
        }

        function replyToComment(commentId) {
            showSuccess(`Reply to comment ${commentId} - Feature coming soon`);
        }

        function deleteComment(commentId) {
            if (confirm('Are you sure you want to delete this comment?')) {
                showSuccess(`Delete comment ${commentId} - Feature coming soon`);
            }
        }
    </script>