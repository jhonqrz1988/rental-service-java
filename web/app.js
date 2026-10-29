document.addEventListener('DOMContentLoaded', () => {
    const keys = {
        accounts: 'rental.accounts',
        session: 'rental.session',
        services: 'rental.services',
        order: 'rental.order',
        bookings: 'rental.bookings',
        reviews: 'rental.reviews',
        systemStatus: 'rental.systemStatus'
    };

    const toast = (message, type = 'info') => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        const item = document.createElement('div');
        item.className = `toast toast--${type}`;
        item.textContent = message;
        container.appendChild(item);
        window.setTimeout(() => item.remove(), 3500);
    };

    const read = (key, fallback) => {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) {
            toast(`No se pudieron leer los datos guardados: ${error.message}`, 'warning');
            return fallback;
        }
    };

    const write = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            toast(`No se pudieron guardar los cambios: ${error.message}`, 'warning');
            return false;
        }
    };

    const text = (tag, value, className) => {
        const node = document.createElement(tag);
        node.textContent = value;
        if (className) node.className = className;
        return node;
    };

    const normalize = (value) => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const formatPrice = (value) => `$${Number(value).toLocaleString('es-CO')} COP`;

    const hashPassword = async (password) => {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('El navegador no permite la autenticación local. Abre el proyecto desde localhost.');
        }
        const bytes = new TextEncoder().encode(password);
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    };

    const openInformation = (title, message) => {
        let dialog = document.getElementById('information-dialog');
        if (!dialog) {
            dialog = document.createElement('dialog');
            dialog.id = 'information-dialog';
            dialog.className = 'app-dialog';
            document.body.appendChild(dialog);
        }
        dialog.replaceChildren();
        dialog.append(text('h2', title));
        dialog.append(text('p', message));
        const close = text('button', 'Cerrar', 'btn-filled');
        close.type = 'button';
        close.addEventListener('click', () => dialog.close());
        dialog.append(close);
        dialog.showModal();
    };

    document.querySelectorAll('a[href="#privacidad"], a[href="#terminos"], a[href="#ayuda"], a[href="#recuperar"]').forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            if (link.hash === '#recuperar') {
                const email = window.prompt('Escribe el correo de la cuenta que deseas recuperar:');
                if (!email) return;
                const accounts = read(keys.accounts, []);
                const account = accounts.find((item) => item.email === email.trim().toLowerCase());
                if (!account) {
                    toast('No se encontró una cuenta con ese correo.', 'warning');
                    return;
                }
                const password = window.prompt('Escribe la nueva contraseña (mínimo 6 caracteres):');
                if (!password || password.length < 6) {
                    toast('La contraseña debe tener al menos 6 caracteres.', 'warning');
                    return;
                }
                try {
                    account.passwordHash = await hashPassword(password);
                    if (write(keys.accounts, accounts)) toast('Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
                } catch (error) {
                    toast(error.message, 'warning');
                }
                return;
            }

            const information = {
                '#privacidad': ['Privacidad', 'Este prototipo guarda datos de demostración únicamente en el almacenamiento local de este navegador.'],
                '#terminos': ['Términos y condiciones', 'Esta versión es una demostración académica. No procesa pagos ni presta servicios reales.'],
                '#ayuda': ['Ayuda', 'Busca un servicio, abre sus detalles y selecciónalo para iniciar una reserva de demostración. Las publicaciones y reservas quedan guardadas en este navegador.']
            }[link.hash];
            if (information) openInformation(information[0], information[1]);
        });
    });

    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tabLogin && tabRegister && loginForm && registerForm) {
        const selectTab = (activeTab, inactiveTab, activeForm, inactiveForm) => {
            activeTab.classList.add('active');
            activeTab.setAttribute('aria-selected', 'true');
            inactiveTab.classList.remove('active');
            inactiveTab.setAttribute('aria-selected', 'false');
            activeForm.hidden = false;
            inactiveForm.hidden = true;
        };
        tabLogin.addEventListener('click', () => selectTab(tabLogin, tabRegister, loginForm, registerForm));
        tabRegister.addEventListener('click', () => selectTab(tabRegister, tabLogin, registerForm, loginForm));

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!loginForm.reportValidity()) return;
            const email = loginForm.querySelector('#email').value.trim().toLowerCase();
            const password = loginForm.querySelector('#password').value;
            const account = read(keys.accounts, []).find((item) => item.email === email);
            if (!account) {
                toast('No existe una cuenta con ese correo. Selecciona “Crear Cuenta” para registrarte.', 'warning');
                return;
            }
            try {
                if (account.passwordHash !== await hashPassword(password)) {
                    toast('La contraseña no es correcta.', 'warning');
                    return;
                }
                if (!write(keys.session, { name: account.name, email: account.email, role: account.role })) return;
                window.location.href = account.role === 'proveedor' ? 'dashboard.html' : 'buscador.html';
            } catch (error) {
                toast(`No se pudo iniciar sesión: ${error.message}`, 'warning');
            }
        });

        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!registerForm.reportValidity()) return;
            const name = registerForm.querySelector('#reg-name').value.trim();
            const email = registerForm.querySelector('#reg-email').value.trim().toLowerCase();
            const password = registerForm.querySelector('#reg-password').value;
            const confirmation = registerForm.querySelector('#reg-password-confirm').value;
            if (password.length < 6 || password !== confirmation) {
                toast('Las contraseñas deben coincidir y tener al menos 6 caracteres.', 'warning');
                return;
            }
            const accounts = read(keys.accounts, []);
            if (accounts.some((account) => account.email === email)) {
                toast('Ya existe una cuenta con ese correo.', 'warning');
                return;
            }
            try {
                const role = registerForm.querySelector('[name="role"]:checked').value;
                accounts.push({ name, email, role, passwordHash: await hashPassword(password) });
                if (!write(keys.accounts, accounts)) return;
                if (!write(keys.session, { name, email, role })) return;
                window.location.href = role === 'proveedor' ? 'publicar-servicio.html' : 'buscador.html';
            } catch (error) {
                toast(`No se pudo crear la cuenta: ${error.message}`, 'warning');
            }
        });
    }

    const iconForCategory = (category) => ({
        plomeria: '🔧', electricidad: '⚡', pintura: '🎨', carpinteria: '🪵',
        limpieza: '🧹', jardineria: '🌳', aseo: '🧹', mudanza: '📦',
        reparaciones: '🛠️', tecnologia: '💻'
    })[normalize(category)] || '🧰';

    const readServiceCard = (card) => {
        const labels = Array.from(card.querySelectorAll('.service-info span'));
        const priceText = card.querySelector('.service-footer strong')?.textContent || '';
        const ratingText = card.querySelector('.service-rating small')?.textContent || '';
        return {
            id: card.dataset.serviceId || normalize(card.querySelector('h3')?.textContent).replace(/\s+/g, '-'),
            title: card.querySelector('h3')?.textContent.trim() || 'Servicio',
            description: card.querySelector('.service-content > p')?.textContent.trim() || '',
            provider: labels[0]?.textContent.replace(/^👤\s*/, '').trim() || 'Proveedor',
            city: labels[1]?.textContent.replace(/^📍\s*/, '').trim() || '',
            category: card.dataset.category || '',
            price: Number(priceText.replace(/[^\d]/g, '')) || 0,
            rating: Number(ratingText.replace(/[^\d.]/g, '')) || 0,
            icon: card.querySelector('.service-image')?.textContent.trim() || '🧰'
        };
    };

    const makeServiceCard = (service, isOwner = false) => {
        const card = document.createElement('article');
        card.className = 'surface-card service-card';
        card.dataset.serviceId = service.id;
        card.dataset.category = service.category;
        card.dataset.price = String(service.price);
        card.dataset.rating = String(service.rating || 0);
        card.dataset.city = service.city;

        const image = text('div', service.icon || iconForCategory(service.category), 'service-image');
        const content = text('div', '', 'service-content');
        content.append(text('h3', service.title));
        content.append(text('p', service.description));
        const info = text('div', '', 'service-info');
        info.append(text('span', `👤 ${service.provider}`));
        info.append(text('span', `📍 ${service.city}`));
        content.append(info);
        const rating = text('div', '', 'service-rating');
        rating.append(document.createTextNode('⭐'.repeat(Math.max(1, Math.min(5, Math.round(service.rating || 5))))));
        rating.append(text('small', ` (${Number(service.rating || 5).toFixed(1)})`));
        content.append(rating);
        const footer = text('div', '', 'service-footer');
        footer.append(text('strong', formatPrice(service.price)));
        const details = text('button', 'Ver detalles', 'btn-filled');
        details.type = 'button';
        details.dataset.serviceDetails = '';
        footer.append(details);
        if (isOwner) {
            const remove = text('button', 'Eliminar publicación', 'btn-outline');
            remove.type = 'button';
            remove.dataset.removeService = service.id;
            footer.append(remove);
        }
        content.append(footer);
        card.append(image, content);
        return card;
    };

    let activeCategory = '';
    const searchForm = document.querySelector('.search-box form');
    const resultGrid = document.querySelector('.results-section .services-grid');
    const resultHeading = document.querySelector('.results-section h2');
    const noResults = document.getElementById('no-results');
    const queryInput = searchForm?.querySelector('input[type="text"]');
    const citySelect = document.getElementById('city');
    const priceSelect = document.getElementById('price');
    const ratingSelect = document.getElementById('rating');

    const renderSearchResults = () => {
        if (!resultGrid) return;
        const query = normalize(queryInput?.value);
        const city = normalize(citySelect?.value);
        const maxPrice = Number(priceSelect?.value) || Infinity;
        const minRating = Number(ratingSelect?.value) || 0;
        let visible = 0;
        Array.from(resultGrid.querySelectorAll('.service-card')).forEach((card) => {
            const service = readServiceCard(card);
            const matches = (!query || normalize(`${service.title} ${service.description} ${service.category}`).includes(query))
                && (!activeCategory || normalize(service.category) === activeCategory)
                && (!city || normalize(service.city) === city)
                && service.price <= maxPrice
                && service.rating >= minRating;
            card.hidden = !matches;
            if (matches) visible += 1;
        });
        if (noResults) noResults.hidden = visible !== 0;
        if (resultHeading) resultHeading.textContent = `Servicios disponibles (${visible})`;
    };

    if (resultGrid) {
        resultGrid.querySelectorAll('.service-card').forEach((card, index) => {
            const data = [
                { category: 'plomeria', id: 'plomeria-residencial' },
                { category: 'electricidad', id: 'electricista-certificado' },
                { category: 'pintura', id: 'pintor-profesional' },
                { category: 'limpieza', id: 'servicio-limpieza' }
            ][index];
            card.dataset.category = data?.category || 'otro';
            card.dataset.serviceId = data?.id || `servicio-${index}`;
            card.dataset.price = String(readServiceCard(card).price);
            card.dataset.rating = String(readServiceCard(card).rating);
        });

        read(keys.services, []).forEach((service) => resultGrid.append(makeServiceCard(service)));
        renderSearchResults();
    }

    document.querySelectorAll('.category-item').forEach((button) => {
        button.type = 'button';
        button.addEventListener('click', () => {
            activeCategory = button.classList.contains('active-category') ? '' : normalize(button.querySelector('span')?.textContent || button.textContent);
            document.querySelectorAll('.category-item').forEach((item) => {
                const active = item === button && activeCategory !== '';
                item.classList.toggle('active-category', active);
                item.setAttribute('aria-pressed', String(active));
            });
            renderSearchResults();
        });
    });

    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            renderSearchResults();
            resultGrid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    [citySelect, priceSelect, ratingSelect].forEach((select) => {
        select?.addEventListener('change', renderSearchResults);
    });

    const serviceDialog = (() => {
        const dialog = document.createElement('dialog');
        dialog.id = 'service-dialog';
        dialog.className = 'app-dialog';
        document.body.appendChild(dialog);
        return dialog;
    })();

    const openService = (service) => {
        serviceDialog.replaceChildren();
        serviceDialog.append(text('h2', service.title));
        serviceDialog.append(text('p', service.description));
        serviceDialog.append(text('p', `Proveedor: ${service.provider}`));
        serviceDialog.append(text('p', `Categoría: ${service.category}`));
        serviceDialog.append(text('p', `Ciudad: ${service.city}`));
        serviceDialog.append(text('p', `Calificación: ${Number(service.rating || 0).toFixed(1)} / 5`));
        serviceDialog.append(text('p', `Precio: ${formatPrice(service.price)}`));
        const actions = text('div', '', 'dialog-actions');
        const book = text('button', 'Solicitar este servicio', 'btn-filled');
        book.type = 'button';
        book.addEventListener('click', () => {
            if (write(keys.order, service)) window.location.href = 'pagos.html';
        });
        const close = text('button', 'Cerrar', 'btn-outline');
        close.type = 'button';
        close.addEventListener('click', () => serviceDialog.close());
        actions.append(book, close);
        serviceDialog.append(actions);
        serviceDialog.showModal();
    };

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-service-details]');
        if (button) openService(readServiceCard(button.closest('.service-card')));
    });

    const publishedContainer = document.getElementById('serviciosPublicados');
    if (publishedContainer) {
        const services = read(keys.services, []);
        publishedContainer.replaceChildren();
        if (services.length === 0) {
            publishedContainer.append(text('p', 'No tienes servicios publicados aún. ¡Crea tu primer servicio!', 'empty-state'));
        } else {
            services.forEach((service) => publishedContainer.append(makeServiceCard(service, true)));
        }
    }

    const publishForm = document.getElementById('formPublicarServicio');
    if (publishForm) {
        publishForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const title = document.getElementById('tituloServicio').value.trim();
            const categorySelect = document.getElementById('categoria');
            const category = categorySelect.value;
            const price = Number(document.getElementById('precioBase').value);
            const description = document.getElementById('descripcion').value.trim();
            const city = document.getElementById('ciudad').value.trim();
            if (!publishForm.reportValidity()) return;
            if (!title || !category || !description || !city || !Number.isFinite(price) || price <= 0) {
                toast('Completa los campos obligatorios con valores válidos.', 'warning');
                return;
            }

            const session = read(keys.session, null);
            const service = {
                id: `servicio-${Date.now()}`,
                title,
                category,
                description,
                city,
                price,
                provider: session?.name || 'Proveedor independiente',
                rating: 5,
                icon: iconForCategory(category)
            };
            const services = read(keys.services, []);
            services.push(service);
            if (!write(keys.services, services)) return;

            publishedContainer?.querySelector('.empty-state')?.remove();
            publishedContainer?.append(makeServiceCard(service, true));
            document.getElementById('mensajeExito').hidden = false;
            publishForm.reset();
            document.getElementById('charCount').textContent = '0/500 caracteres';
        });

        document.getElementById('descripcion')?.addEventListener('input', (event) => {
            document.getElementById('charCount').textContent = `${event.target.value.length}/500 caracteres`;
        });
    }

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-service]');
        if (!button) return;
        const serviceId = button.dataset.removeService;
        const services = read(keys.services, []);
        if (!write(keys.services, services.filter((service) => service.id !== serviceId))) return;
        button.closest('.service-card')?.remove();
        if (publishedContainer && !publishedContainer.querySelector('.service-card')) {
            publishedContainer.append(text('p', 'No tienes servicios publicados aún. ¡Crea tu primer servicio!', 'empty-state'));
        }
        toast('Publicación eliminada. Ya no aparecerá en el buscador.', 'success');
    });

    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        const order = read(keys.order, null);
        const summary = document.getElementById('checkout-summary');
        const empty = document.getElementById('checkout-empty');
        const confirm = paymentForm.querySelector('[type="submit"]');
        if (order) {
            summary.hidden = false;
            empty.hidden = true;
            document.getElementById('checkout-title').textContent = order.title;
            document.getElementById('checkout-provider').textContent = order.provider;
            document.getElementById('checkout-city').textContent = order.city;
            document.getElementById('checkout-price').textContent = formatPrice(order.price);
        } else {
            summary.hidden = true;
            empty.hidden = false;
            confirm.disabled = true;
        }

        paymentForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!order) {
                toast('Primero selecciona un servicio desde el buscador.', 'warning');
                return;
            }
            if (!paymentForm.reportValidity()) return;
            const bookings = read(keys.bookings, []);
            const session = read(keys.session, null);
            const booking = {
                id: `reserva-${Date.now()}`,
                client: session?.name || 'Usuario de prueba',
                service: order.title,
                provider: order.provider,
                city: order.city,
                price: order.price,
                contactMethod: document.getElementById('payment-method').value,
                status: 'Solicitud enviada',
                createdAt: new Date().toISOString()
            };
            bookings.push(booking);
            if (!write(keys.bookings, bookings)) return;
            localStorage.removeItem(keys.order);
            paymentForm.hidden = true;
            summary.hidden = true;
            empty.hidden = false;
            empty.textContent = `Solicitud enviada para “${booking.service}”. No se realizó ningún cobro. Puedes consultar la reserva en el dashboard.`;
            empty.classList.add('alert', 'alert-success');
            const dashboardLink = text('a', 'Ir al dashboard');
            dashboardLink.href = 'dashboard.html';
            empty.append(document.createElement('br'), dashboardLink);
        });
    }

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        const stars = Array.from(reviewForm.querySelectorAll('[data-rating]'));
        let selectedRating = 0;
        const paintStars = (value) => stars.forEach((star, index) => {
            star.setAttribute('aria-pressed', String(index < value));
            star.classList.toggle('is-selected', index < value);
        });
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                selectedRating = index + 1;
                paintStars(selectedRating);
            });
        });
        reviewForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!selectedRating) {
                toast('Selecciona de una a cinco estrellas antes de enviar.', 'warning');
                return;
            }
            const reviews = read(keys.reviews, []);
            reviews.push({
                rating: selectedRating,
                experience: document.getElementById('experience').value,
                comments: document.getElementById('comments').value.trim(),
                aspects: Array.from(reviewForm.querySelectorAll('[name="aspects"]:checked')).map((item) => item.value),
                createdAt: new Date().toISOString()
            });
            if (!write(keys.reviews, reviews)) return;
            reviewForm.hidden = true;
            const message = text('p', `Tu calificación de ${selectedRating} estrellas quedó guardada en este navegador. ¡Gracias por compartir tu experiencia!`, 'alert alert-success');
            reviewForm.after(message);
        });
    }

    const systemForm = document.getElementById('system-form');
    if (systemForm) {
        const status = document.getElementById('maintenance');
        const savedStatus = read(keys.systemStatus, '');
        if (savedStatus) status.value = savedStatus;
        const currentStatus = document.getElementById('current-system-status');
        const updateStatus = (value) => {
            if (currentStatus) currentStatus.textContent = `Estado guardado: ${value}`;
        };
        updateStatus(status.value);
        systemForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (write(keys.systemStatus, status.value)) updateStatus(status.value);
        });
    }

    const bookingsTable = document.querySelector('[data-bookings]');
    if (bookingsTable) {
        const bookings = read(keys.bookings, []);
        if (bookings.length) bookingsTable.querySelector('[data-empty-booking]')?.remove();
        bookings.forEach((booking) => {
            const row = document.createElement('tr');
            [booking.client || 'Usuario de prueba', booking.service, new Date(booking.createdAt).toLocaleDateString('es-CO'), booking.status, 'Sin cobro'].forEach((value) => {
                row.append(text('td', value));
            });
            bookingsTable.append(row);
        });
    }

    const bookingCount = read(keys.bookings, []).length;
    document.querySelectorAll('[data-booking-count]').forEach((element) => {
        element.textContent = String(bookingCount);
    });
    document.querySelectorAll('[data-booking-pending]').forEach((element) => {
        element.textContent = String(bookingCount);
    });
    document.querySelectorAll('[data-admin-providers]').forEach((element) => {
        element.textContent = String(read(keys.accounts, []).filter((account) => account.role === 'proveedor').length);
    });
    document.querySelectorAll('[data-admin-clients]').forEach((element) => {
        element.textContent = String(read(keys.accounts, []).filter((account) => account.role === 'cliente').length);
    });
    document.querySelectorAll('[data-admin-services]').forEach((element) => {
        element.textContent = String(read(keys.services, []).length);
    });

    const ratingWidget = document.getElementById('rating-widget');
    if (ratingWidget) {
        const reviews = read(keys.reviews, []);
        if (reviews.length) {
            const baseRating = Number(ratingWidget.dataset.rating) || 0;
            const baseReviews = Number(ratingWidget.dataset.reviews) || 0;
            const total = baseReviews + reviews.length;
            const average = ((baseRating * baseReviews) + reviews.reduce((sum, review) => sum + review.rating, 0)) / total;
            document.getElementById('score-number').textContent = average.toFixed(1);
            document.getElementById('reviews-count').textContent = `Basado en ${total} reseñas`;
            document.getElementById('stars').textContent = '★'.repeat(Math.round(average)).padEnd(5, '☆');
        }
    }

    document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-nav a').forEach((item) => item.classList.toggle('active', item === link));
        });
    });
});
