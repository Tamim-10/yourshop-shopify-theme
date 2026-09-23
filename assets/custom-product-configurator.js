document.addEventListener('DOMContentLoaded', () => {
    const configurators = document.querySelectorAll('.cp-configurator');

    configurators.forEach((configurator) => {
        const productImage = configurator.querySelector(
            '.cp-configurator__image'
        );

        /*
         * ============================================================
         * ORDER SUMMARY
         * ============================================================
         */

        const productDataEl = configurator.querySelector(
            '[data-config-product]'
        );

        let basePrice = 0;
        /** @type {any} */
        let productData = {};

        if (productDataEl) {
            try {
                productData = JSON.parse(productDataEl.textContent || '{}');
                basePrice = productData.price || 0;
            } catch (error) {
                productData = {};
                basePrice = 0;
            }
        }

        const totalPriceEl = configurator.querySelector('[data-config-total]');
        const checkoutPriceEls = configurator.querySelectorAll('[data-checkout-price]');
        const reviewTotalEl = configurator.querySelector('[data-review-total]');

        /** @param {number} cents */
        const formatMoney = (cents) => `$${(cents / 100).toFixed(2)}`;

        /** @param {Element} option */
        const isAvailable = (option) => (
            (/** @type {HTMLElement} */ (option)).dataset.available !== 'false'
        );

        /** @param {NodeListOf<Element>} options */
        const getSelectedPrice = (options) => {
            let price = 0;

            options.forEach((option) => {
                if (option.classList.contains('is-selected')) {
                    price = parseInt(
                        (/** @type {HTMLElement} */ (option)).dataset.price || '0',
                        10
                    ) || 0;
                }
            });

            return price;
        };

        const watchPriceEl = configurator.querySelector('[data-watch-price]');
        const watchComparePriceEl = configurator.querySelector('[data-watch-compare-price]');
        const watchDiscountEl = configurator.querySelector('[data-watch-discount]');
        const paymentFullPriceEl = configurator.querySelector('[data-payment-full-price]');

        // The selected Band Color is a variant of the watch, so its price
        // replaces the base price instead of being added to it.
        const getWatchPricing = () => {
            /** @type {HTMLElement | null} */
            let selectedBand = null;

            bandOptions.forEach((option) => {
                if (option.classList.contains('is-selected')) {
                    selectedBand = /** @type {HTMLElement} */ (option);
                }
            });

            if (!selectedBand) {
                return {
                    price: basePrice,
                    compareAtPrice: productData.compareAtPrice || 0
                };
            }

            return {
                price: parseInt(selectedBand.dataset.price || '', 10) || basePrice,
                compareAtPrice: parseInt(selectedBand.dataset.comparePrice || '0', 10)
                    || productData.compareAtPrice
                    || 0
            };
        };

        const updateWatchPrice = () => {
            const { price, compareAtPrice } = getWatchPricing();
            const hasDiscount = compareAtPrice > price;
            const priceHtml = hasDiscount
                ? `${formatMoney(price)} <s>${formatMoney(compareAtPrice)}</s>`
                : formatMoney(price);

            if (watchPriceEl) {
                watchPriceEl.textContent = formatMoney(price);
            }

            if (watchComparePriceEl) {
                watchComparePriceEl.textContent = hasDiscount ? formatMoney(compareAtPrice) : '';
                watchComparePriceEl.toggleAttribute('hidden', !hasDiscount);
            }

            if (watchDiscountEl) {
                watchDiscountEl.textContent = hasDiscount
                    ? `${Math.floor(((compareAtPrice - price) * 100) / compareAtPrice)}% OFF`
                    : '';
                watchDiscountEl.toggleAttribute('hidden', !hasDiscount);
            }

            if (paymentFullPriceEl) {
                paymentFullPriceEl.innerHTML = priceHtml;
            }

            if (paymentSummaryPrice && configurator.dataset.paymentOption !== 'monthly') {
                paymentSummaryPrice.innerHTML = priceHtml;
            }
        };

        const updateOrderSummary = () => {
            updateWatchPrice();

            const total = getWatchPricing().price
                + getSelectedPrice(schoolClipOptions)
                + getSelectedPrice(screenProtectorOptions)
                + getSelectedPrice(chargingOptions);

            const formattedTotal = formatMoney(total);

            if (totalPriceEl) {
                totalPriceEl.textContent = formattedTotal;
            }

            checkoutPriceEls.forEach((el) => {
                el.textContent = formattedTotal;
            });

            if (reviewTotalEl) {
                reviewTotalEl.textContent = formattedTotal;
            }
        };

        /*
         * ============================================================
         * PAYMENT
         * ============================================================
         */

        const paymentOptions = configurator.querySelectorAll(
            '[data-payment-option]'
        );

        const paymentSummaryLabel = configurator.querySelector(
            '[data-payment-summary-label]'
        );

        const paymentSummaryPrice = configurator.querySelector(
            '[data-payment-summary-price]'
        );

        paymentOptions.forEach((option) => {
            option.addEventListener('click', () => {

                // Remove selected state from all payment options
                paymentOptions.forEach((item) => {
                    item.classList.remove('is-selected');
                    item.setAttribute('aria-pressed', 'false');
                });

                // Select clicked payment option
                option.classList.add('is-selected');
                option.setAttribute('aria-pressed', 'true');

                const paymentType = option.dataset.paymentOption;

                // Update the summary line above the options
                if (paymentSummaryLabel && paymentSummaryPrice) {

                    if (paymentType === 'monthly') {
                        const monthlyPriceEl = option.querySelector(
                            '.cp-configurator__payment-price'
                        );

                        paymentSummaryLabel.textContent = 'Pay over time';
                        paymentSummaryPrice.innerHTML = monthlyPriceEl
                            ? monthlyPriceEl.innerHTML
                            : '';

                    } else {
                        const fullPriceEl = option.querySelector(
                            '.cp-configurator__payment-price'
                        );

                        paymentSummaryLabel.textContent = 'Pay in full today';
                        paymentSummaryPrice.innerHTML = fullPriceEl
                            ? fullPriceEl.innerHTML
                            : '';
                    }
                }

                configurator.dataset.paymentOption = paymentType;

                console.log('Selected payment option:', paymentType);
            });
        });


        /*
         * ============================================================
         * SCHOOL CLIP
         * ============================================================
         */

        const schoolClipOptions = configurator.querySelectorAll(
            '[data-school-clip-variant-id]'
        );

        const reviewSchoolClip = configurator.querySelector(
            '[data-review-school-clip]'
        );

        schoolClipOptions.forEach((option) => {
            option.addEventListener('click', () => {
                schoolClipOptions.forEach((item) => {
                    item.classList.remove('is-selected');
                    item.setAttribute('aria-pressed', 'false');

                    const check = item.querySelector(
                        '.cp-configurator__selected-check'
                    );

                    if (check) {
                        check.remove();
                    }
                });

                option.classList.add('is-selected');
                option.setAttribute('aria-pressed', 'true');

                const check = document.createElement('span');
                check.className = 'cp-configurator__selected-check';
                check.textContent = '✓';

                option.appendChild(check);

                if (reviewSchoolClip) {
                    const selectedImage = option.querySelector('img');

                    if (selectedImage) {
                        reviewSchoolClip.textContent = selectedImage.alt;
                    } else {
                        reviewSchoolClip.textContent = 'School Clip';
                    }
                }

                // Change main product image to the selected School Clip
                const schoolClipImage = option.dataset.schoolClipImage;
                const schoolClipImageAlt = option.dataset.schoolClipImageAlt;

                if (productImage && schoolClipImage) {
                    productImage.removeAttribute('srcset');
                    productImage.src = schoolClipImage;
                    productImage.alt = schoolClipImageAlt;
                }

                updateOrderSummary();

                console.log(
                    'Selected School Clip variant ID:',
                    option.dataset.schoolClipVariantId
                );
            });
        });


        /*
         * ============================================================
         * BAND COLOR
         * ============================================================
         */

        const bandOptions = configurator.querySelectorAll(
            '[data-band-variant-id]'
        );

        const reviewBand = configurator.querySelector(
            '[data-review-band]'
        );

        bandOptions.forEach((option) => {
            option.addEventListener('click', () => {

                // Remove selected state from all band colors
                bandOptions.forEach((item) => {
                    item.classList.remove('is-selected');
                    item.setAttribute('aria-pressed', 'false');
                });

                // Select clicked band color
                option.classList.add('is-selected');
                option.setAttribute('aria-pressed', 'true');

                // Get selected band information
                const bandVariantId = option.dataset.bandVariantId;
                const bandImage = option.dataset.bandImage;
                const bandTitle = option.dataset.bandTitle;

                // Change main product image
                if (productImage && bandImage) {
                    productImage.removeAttribute('srcset');
                    productImage.src = bandImage;
                    productImage.alt = bandTitle;
                }

                // Update Review Your Build
                if (reviewBand) {
                    reviewBand.textContent = bandTitle;
                }

                // Store selected Band Color variant ID
                configurator.dataset.bandVariantId = bandVariantId;

                hideTermsError();
                updateOrderSummary();

                console.log('Selected Band Color:', bandTitle);
                console.log('Selected Band variant ID:', bandVariantId);
                console.log('Selected Band image:', bandImage);
            });
        });


        /*
         * ============================================================
         * SCREEN PROTECTOR
         * ============================================================
         */

        const screenProtectorOptions = /** @type {NodeListOf<HTMLElement>} */ (
            configurator.querySelectorAll('[data-screen-protector]')
        );

        const reviewProtector = configurator.querySelector(
            '[data-review-protector]'
        );

        screenProtectorOptions.forEach((option) => {
            option.addEventListener('click', () => {

                // Remove selected state from all screen protector options
                screenProtectorOptions.forEach((item) => {
                    item.classList.remove('is-selected');
                    item.setAttribute('aria-pressed', 'false');
                });

                // Select clicked screen protector option
                option.classList.add('is-selected');
                option.setAttribute('aria-pressed', 'true');

                // Get selected screen protector information
                const protectorType = option.dataset.screenProtector;
                const protectorImage = option.dataset.protectorImage;
                const protectorImageAlt = option.dataset.protectorImageAlt;
                const protectorLabel = protectorType === 'enabled'
                    ? option.dataset.protectorTitle || 'Screen Protector'
                    : 'None';

                // Change main product image
                if (productImage && protectorImage) {
                    productImage.removeAttribute('srcset');
                    productImage.src = protectorImage;
                    productImage.alt = protectorImageAlt || '';
                }

                // Update Review Your Build
                if (reviewProtector) {
                    reviewProtector.textContent = protectorLabel;
                }

                updateOrderSummary();

                console.log('Selected screen protector:', protectorLabel);
            });
        });


        /*
         * ============================================================
         * CHARGING
         * ============================================================
         */

        const chargingOptions = configurator.querySelectorAll(
            '[data-charging]'
        );

        const reviewCharging = configurator.querySelector(
            '[data-review-charging]'
        );

        chargingOptions.forEach((option) => {
            option.addEventListener('click', () => {

                // Remove selected state from all charging options
                chargingOptions.forEach((item) => {
                    item.classList.remove('is-selected');
                    item.setAttribute('aria-pressed', 'false');
                });

                // Select clicked charging option
                option.classList.add('is-selected');
                option.setAttribute('aria-pressed', 'true');

                // Get selected charging information
                const chargingType = option.dataset.charging;
                const chargingImage = option.dataset.chargingImage;
                const chargingImageAlt = option.dataset.chargingImageAlt;
                const chargingLabel = chargingType === 'stand'
                    ? 'Charging Stand'
                    : 'Standard Charging Clip';

                // Change main product image
                if (productImage && chargingImage) {
                    productImage.removeAttribute('srcset');
                    productImage.src = chargingImage;
                    productImage.alt = chargingImageAlt;
                }

                // Update Review Your Build
                if (reviewCharging) {
                    reviewCharging.textContent = chargingLabel;
                }

                updateOrderSummary();

                console.log('Selected charging option:', chargingLabel);
            });
        });


        /*
         * ============================================================
         * ADD TO CART
         * ============================================================
         */

        const checkoutButtons = configurator.querySelectorAll(
            '[data-config-checkout]'
        );

        const termsCheckbox = /** @type {HTMLInputElement} */ (
            configurator.querySelector('[data-terms-checkbox]')
        );

        const termsError = configurator.querySelector('[data-terms-error]');

        /**
         * @param {NodeListOf<Element>} options
         * @param {string} datasetKey
         */
        const getSelectedVariantId = (options, datasetKey) => {
            let variantId = null;

            options.forEach((option) => {
                if (option.classList.contains('is-selected') && isAvailable(option)) {
                    variantId = (/** @type {HTMLElement} */ (option)).dataset[datasetKey] || null;
                }
            });

            return variantId;
        };

        // Watch — Band Color selection overrides the base variant
        const getWatchSelection = () => {
            let selectedBand = null;

            bandOptions.forEach((option) => {
                if (option.classList.contains('is-selected')) {
                    selectedBand = /** @type {HTMLElement} */ (option);
                }
            });

            if (selectedBand) {
                return {
                    id: selectedBand.dataset.bandVariantId,
                    title: selectedBand.dataset.bandTitle || '',
                    available: isAvailable(selectedBand)
                };
            }

            return {
                id: productData.variantId,
                title: productData.variantTitle || '',
                available: productData.variantAvailable !== false
            };
        };

        const buildCartItems = () => {
            const items = [];

            const watch = getWatchSelection();

            if (watch.id) {
                items.push({ id: parseInt(String(watch.id), 10), quantity: 1 });
            }

            // School Clip (included free)
            const schoolClipVariantId = getSelectedVariantId(
                schoolClipOptions,
                'schoolClipVariantId'
            );

            if (schoolClipVariantId) {
                items.push({ id: parseInt(schoolClipVariantId, 10), quantity: 1 });
            }

            // Screen Protector
            let screenProtectorVariantId = null;

            screenProtectorOptions.forEach((option) => {
                if (
                    option.classList.contains('is-selected')
                    && option.dataset.screenProtector === 'enabled'
                    && isAvailable(option)
                ) {
                    screenProtectorVariantId = option.dataset.variantId;
                }
            });

            if (screenProtectorVariantId) {
                items.push({ id: parseInt(screenProtectorVariantId, 10), quantity: 1 });
            }

            // Charging Stand
            let chargingVariantId = null;

            chargingOptions.forEach((option) => {
                if (
                    option.classList.contains('is-selected')
                    && (/** @type {HTMLElement} */ (option)).dataset.charging === 'stand'
                    && isAvailable(option)
                ) {
                    chargingVariantId = (/** @type {HTMLElement} */ (option)).dataset.variantId;
                }
            });

            if (chargingVariantId) {
                items.push({ id: parseInt(chargingVariantId, 10), quantity: 1 });
            }

            return items;
        };

        /** @param {boolean} isLoading */
        const setCheckoutLoading = (isLoading) => {
            checkoutButtons.forEach((button) => {
                (/** @type {HTMLButtonElement} */ (button)).disabled = isLoading;
                button.classList.toggle('is-loading', isLoading);
            });
        };

        /** @param {string} message */
        const showTermsError = (message) => {
            if (!termsError) {
                alert(message);
                return;
            }

            termsError.textContent = message;
            termsError.removeAttribute('hidden');
        };

        const hideTermsError = () => {
            if (termsError) {
                termsError.setAttribute('hidden', '');
            }
        };

        const addToCart = () => {
            if (termsCheckbox && !termsCheckbox.checked) {
                showTermsError('Please agree to the terms to continue.');
                termsCheckbox.focus();
                return;
            }

            hideTermsError();

            const watch = getWatchSelection();

            if (!watch.available) {
                showTermsError(
                    watch.title
                        ? `${watch.title} is sold out. Please choose another band color.`
                        : 'This watch is sold out.'
                );
                return;
            }

            const items = buildCartItems();

            if (!items.length) {
                return;
            }

            setCheckoutLoading(true);

            fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            })
                .then((response) => (
                    response.ok
                        ? response.json()
                        : response.json().then((data) => {
                            throw new Error(
                                data.description || data.message || 'Unable to add items to cart.'
                            );
                        })
                ))
                .then(() => {
                    window.location.href = '/checkout';
                })
                .catch((error) => {
                    setCheckoutLoading(false);
                    showTermsError(error.message);
                    console.error('Add to cart failed:', error);
                });
        };

        checkoutButtons.forEach((button) => {
            button.addEventListener('click', addToCart);
        });

        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', () => {
                if (termsCheckbox.checked) {
                    hideTermsError();
                }
            });
        }

        updateOrderSummary();
    });
});