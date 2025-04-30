document.addEventListener('DOMContentLoaded', function () {
    const videoInput = document.querySelector('input[name="video_file"]');

    if (videoInput) {
        const spinner = document.createElement('div');
        spinner.classList.add('spinner');
        spinner.style.display = 'none';
        spinner.style.position = 'fixed';
        spinner.style.top = '50%';
        spinner.style.left = '50%';
        spinner.style.transform = 'translate(-50%, -50%)';
        spinner.style.border = '16px solid #f3f3f3';
        spinner.style.borderTop = '16px solid #3498db';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '60px';
        spinner.style.height = '60px';
        spinner.style.zIndex = '9999';
        spinner.style.animation = 'spin 2s linear infinite';
        document.body.appendChild(spinner);

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        videoInput.addEventListener('change', function () {
            if (videoInput.files.length > 0) {
                spinner.style.display = 'block';
            }
        });
    }
});
