import { getAuthHeaders, API_CONFIG } from './chavetoken.js';

// Seleção dos elementos do DOM
const loginForm = document.getElementById('loginForm');
const cpfInput = document.getElementById('cpf');
const senhaInput = document.getElementById('senha');
const errorMsg = document.getElementById('error-msg');
const btnSubmit = document.getElementById('btnSubmit');

/**
 * 1. MÁSCARA DE CPF
 * Formata o CPF enquanto o usuário digita (000.000.000-00)
 */
cpfInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número

    if (value.length > 11) value = value.slice(0, 11); // Limita tamanho

    // Adiciona os pontos e traço
    if (value.length > 9) {
        value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
        value = value.replace(/^(\d{3})(\d{3})(\d{3}).*/, "$1.$2.$3");
    } else if (value.length > 3) {
        value = value.replace(/^(\d{3})(\d{3}).*/, "$1.$2");
    }
    
    e.target.value = value;
});

/**
 * 2. FUNÇÃO DE LOGIN
 * Gerencia o envio do formulário
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar
    
    // Reset visual
    mostrarErro(false);
    btnSubmit.innerText = 'Autenticando...';
    btnSubmit.disabled = true;

    // Prepara os dados (Remove pontuação do CPF para enviar limpo)
    const cpfLimpo = cpfInput.value.replace(/\D/g, "");
    const senha = senhaInput.value;

    try {
        // Pega os headers de segurança (X-API-KEY + X-API-TOKEN)
        const authHeaders = await getAuthHeaders();

        // Faz a chamada para a API
        const response = await fetch(`${API_CONFIG.baseUrl}/api/clientes/login`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                cpf: cpfLimpo,
                senha: senha
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // SUCESSO: Salva sessão e redireciona
            salvarSessaoSegura(result.data);
            
            // Pequeno delay para usuário ver que deu certo (opcional)
            btnSubmit.innerText = 'Sucesso!';
            setTimeout(() => {
                window.location.href = 'index.html'; // Redireciona para a Home
            }, 500);

        } else {
            // ERRO DA API (Ex: Senha incorreta)
            throw new Error(result.message || 'CPF ou senha inválidos.');
        }

    } catch (error) {
        console.error("Erro no login:", error);
        mostrarErro(error.message || "Erro ao conectar com o servidor.");
        btnSubmit.innerText = 'ENTRAR';
        btnSubmit.disabled = false;
    }
});

/**
 * 3. SALVAMENTO SEGURO (Storage)
 * Salva os dados no LocalStorage codificados em Base64
 * para não ficarem expostos como texto puro.
 */
function salvarSessaoSegura(userData) {
    const sessao = {
        usuario: {
            id: userData.id,
            nome: userData.nome_completo,
            email: userData.email,
            celular: userData.celular
        },
        token_acesso: new Date().getTime(), // Timestamp do login
        logado: true
    };

    // Converte para String JSON
    const jsonString = JSON.stringify(sessao);
    
    // Codifica em Base64 (Obfuscação básica)
    const dadosCodificados = btoa(jsonString);

    localStorage.setItem('boutique_diniz_session', dadosCodificados);
}

/**
 * Helper para exibir mensagens de erro na tela
 */
function mostrarErro(mensagem) {
    if (!mensagem) {
        errorMsg.style.display = 'none';
        return;
    }
    errorMsg.innerText = mensagem;
    errorMsg.style.display = 'block';
    
    // Animaçãozinha de "shake" se quiser (opcional)
    loginForm.classList.add('shake');
    setTimeout(() => loginForm.classList.remove('shake'), 500);
}