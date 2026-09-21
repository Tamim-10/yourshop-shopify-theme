document.addEventListener('DOMContentLoaded', () => {
    const configurators = document.querySelectorAll('.cp-configurator');

    configurators.forEach((configurator) => {
        const productImage = configurator.querySelector(
            '.cp-configurator__image'
        );

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

                console.log('Selected charging option:', chargingLabel);
            });
        });
    });
});