document.addEventListener('DOMContentLoaded', function() {
    // Gestisce sia i form normali che quelli in Unfold
    document.addEventListener('submit', function(event) {
        const form = event.target;
        if (!form.matches('form')) return;

        console.log("Form inviato - loader attivato");

        // Crea il loader
        const loader = document.createElement('div');
        loader.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm';
        loader.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="relative w-16 h-16">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-8 h-8 border-4 border-white border-b-transparent rounded-full animate-spin-reverse"></div>
                    </div>
                </div>
                <p class="mt-4 text-white font-medium">Processing...</p>
            </div>
        `;

        // Aggiungi il loader al body
        document.body.appendChild(loader);

        // Disabilita il pulsante di submit
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // Rimuovi il loader quando la pagina cambia (fallback)
        window.addEventListener('beforeunload', function() {
            loader.remove();
        });
    });
});