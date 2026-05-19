
(function () {
    const path = window.location.pathname;
    const isPublic = path.includes('/public/');
    const base = isPublic ? '../app/controllers/usuario/php/' : '../../../../app/controllers/usuario/php/';

    async function carregarSino() {
        try {
            const resp = await fetch(base + 'notif_sino.php');
            const dados = await resp.json();

            const badge = document.getElementById('sino-badge');
            const lista = document.getElementById('sino-lista');

            if (!badge || !lista) return;

            const count = dados.nao_lidas || 0;

            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = 'flex';
                document.getElementById('btn-sino').classList.add('sino-ativo');
            } else {
                badge.style.display = 'none';
                document.getElementById('btn-sino').classList.remove('sino-ativo');
            }

            if (!dados.data || dados.data.length === 0) {
                lista.innerHTML = '<li class="sino-vazio">Nenhuma notificação</li>';
                return;
            }

            lista.innerHTML = dados.data.map(n => `
                <li class="sino-item${n.lida == '0' || n.lida === false ? ' sino-nao-lida' : ''}">
                    <div class="sino-item-titulo">${n.titulo || 'Notificação'}</div>
                    <div class="sino-item-msg">${n.mensagem}</div>
                    <div class="sino-item-data">${n.data_envio}</div>
                </li>
            `).join('');

        } catch (e) {
            console.warn('Erro ao carregar notificações:', e);
        }
    }

    async function marcarLidas() {
        try {
            await fetch(base + 'marcar_notif_lidas.php', { method: 'POST' });
            const badge = document.getElementById('sino-badge');
            if (badge) badge.style.display = 'none';
            document.getElementById('btn-sino')?.classList.remove('sino-ativo');
            document.querySelectorAll('.sino-nao-lida').forEach(el => el.classList.remove('sino-nao-lida'));
        } catch (e) {}
    }

    document.addEventListener('DOMContentLoaded', function () {
        const btn = document.getElementById('btn-sino');
        const dropdown = document.getElementById('sino-dropdown');
        if (!btn || !dropdown) return;

        carregarSino();

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const aberto = dropdown.classList.toggle('sino-aberto');
            if (aberto) marcarLidas();
        });

        document.addEventListener('click', function (e) {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('sino-aberto');
            }
        });
    });
})();