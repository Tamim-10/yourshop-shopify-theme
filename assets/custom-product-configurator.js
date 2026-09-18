document.addEventListener('DOMContentLoaded', () => {
    const configurators = document.querySelectorAll('.cp-configurator');

    configurators.forEach((configurator) => {
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

        const productImage = configurator.querySelector(
            '.cp-configurator__image'
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
    });
});