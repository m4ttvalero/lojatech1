// ==================== CONFIGURAÇÕES GERAIS ====================

// Chaves usadas para guardar a posição de rolagem e a página de retorno.
const scrollKey = 'lojaTechProdutosScroll';
const returnPageKey = 'lojaTechProdutosReturnPage';

// Elementos do formulário de contato. Em outras páginas, esses elementos não existem.
const formularioContato = document.querySelector('#formulario-contato');
const mensagemFormulario = document.querySelector('#mensagem-formulario');
const mensagemCarregamento = document.querySelector('#mensagem-carregamento');

// ==================== FUNÇÕES AUXILIARES ====================

// Converte números para o formato de moeda usado no site.
const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', {
	currency: 'BRL',
	style: 'currency'
});

// Converte textos como "R$ 1.299,90" em um número decimal.
const obterPreco = (texto) => Number(texto.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());

// Lê os dados básicos do produto armazenados nos parâmetros da URL.
const obterDadosProduto = (dados) => ({
	nome: dados.get('nome'),
	descricao: dados.get('descricao'),
	imagem: dados.get('imagem'),
	preco: Number(dados.get('preco'))
});

// ==================== PÁGINA DE PAGAMENTO ====================

// Preenche a página de pagamento e controla a escolha do método de pagamento.
const configurarPagamento = () => {
	// Localiza os elementos que serão preenchidos com os dados do produto.
	const imagem = document.querySelector('#imagem-produto-pagamento');
	const titulo = document.querySelector('#titulo-produto-pagamento');
	const descricao = document.querySelector('#descricao-produto-pagamento');
	const preco = document.querySelector('#preco-produto-pagamento');
	const detalhes = document.querySelector('#detalhes-pagamento');
	const desconto = document.querySelector('#desconto-pagamento');
	const total = document.querySelector('#total-pagamento');
	const parcelasContainer = document.querySelector('#parcelas-container');
	const parcelas = document.querySelector('#parcelas-pagamento');
	const botaoFinalizar = document.querySelector('#btn-finalizar-compra');
	// Interrompe a função quando o script está sendo executado em outra página.
	if (!imagem || !titulo || !descricao || !preco || !detalhes || !desconto || !total || !parcelasContainer || !parcelas || !botaoFinalizar) {
		return;
	}

	// Obtém os dados enviados pela página do produto.
	const dados = new URLSearchParams(window.location.search);
	const nome = dados.get('nome');
	const descricaoProduto = dados.get('descricao');
	const imagemProduto = dados.get('imagem');
	const precoProduto = Number(dados.get('preco'));

	// Mostra uma mensagem caso a página tenha sido aberta sem um produto válido.
	if (!nome || !descricaoProduto || !imagemProduto || !Number.isFinite(precoProduto)) {
		titulo.textContent = 'Produto não encontrado';
		descricao.textContent = 'Volte aos produtos e escolha um item para continuar.';
		return;
	}
	// Exibe nome, descrição, imagem e preço do produto escolhido.
	imagem.src = imagemProduto;
	imagem.alt = nome;
	titulo.textContent = nome;
	descricao.textContent = descricaoProduto;
	preco.textContent = formatarMoeda(precoProduto);

	// Recalcula o valor sempre que o método ou a quantidade de parcelas muda.
	const atualizarTotal = () => {
		// Identifica o método selecionado e a quantidade de parcelas atual.
		const metodo = document.querySelector('input[name="metodo-pagamento"]:checked')?.value;
		const valorParcela = Number(parcelas.value || 1);
		// Crédito não tem desconto; Pix dá 10% e débito dá 5% de desconto.
		const valorFinal = metodo === 'credito' ? precoProduto : precoProduto * (metodo === 'pix' ? 0.9 : 0.95);

		// Libera os detalhes depois que um método foi escolhido.
		detalhes.hidden = false;
		// Parcelas só ficam disponíveis para o método de crédito.
		parcelasContainer.hidden = metodo !== 'credito';
		// Atualiza a mensagem de desconto conforme a opção escolhida.
		desconto.textContent = metodo === 'pix' ? 'Desconto de 10% no Pix' : metodo === 'debito' ? 'Desconto de 5% no Débito' : 'Pagamento no crédito sem desconto';
		// No crédito, mostra o total e o valor de cada parcela.
		total.textContent = metodo === 'credito'
			? `${formatarMoeda(valorFinal)} em ${valorParcela}x de ${formatarMoeda(valorFinal / valorParcela)}`
			: `Total: ${formatarMoeda(valorFinal)}`;
	};

	// Cria dinamicamente as opções de 1x até 12x no campo de crédito.
	for (let parcela = 1; parcela <= 12; parcela += 1) {
		const opcao = document.createElement('option');
		opcao.value = String(parcela);
		opcao.textContent = `${parcela}x`;
		parcelas.appendChild(opcao);
	}
	// Recalcula o pedido quando o usuário troca o método de pagamento.
	document.querySelectorAll('input[name="metodo-pagamento"]').forEach((opcao) => {
		opcao.addEventListener('change', atualizarTotal);
	});
	// Recalcula o valor da parcela quando a quantidade escolhida muda.
	parcelas.addEventListener('change', atualizarTotal);

	// Envia os dados da compra para a etapa de endereço e revisão.
	botaoFinalizar.addEventListener('click', (event) => {
		event.preventDefault();
		// Recupera novamente o método e o total selecionados.
		const metodo = document.querySelector('input[name="metodo-pagamento"]:checked')?.value;
		const valorParcela = Number(parcelas.value || 1);
		const valorFinal = metodo === 'credito' ? precoProduto : precoProduto * (metodo === 'pix' ? 0.9 : 0.95);
		// Monta os parâmetros que serão lidos pela página de finalização.
		const parametros = new URLSearchParams({
			nome,
			descricao: descricaoProduto,
			imagem: imagemProduto,
			preco: String(precoProduto),
			metodo,
			total: String(valorFinal),
			parcelas: metodo === 'credito' ? String(valorParcela) : '1'
		});

		// Redireciona para a próxima etapa do checkout.
		window.location.href = `../HTML/finalizacao.html?${parametros.toString()}`;
	});
};

// ==================== PÁGINA DE FINALIZAÇÃO ====================

// Exibe a revisão da compra e valida os dados de entrega.
const configurarFinalizacao = () => {
	// Localiza o resumo, o formulário e a mensagem de sucesso.
	const resumo = document.querySelector('#resumo-finalizacao');
	const formulario = document.querySelector('#formulario-finalizacao');
	const mensagemFormularioFinalizacao = document.querySelector('#mensagem-finalizacao-formulario');
	const mensagem = document.querySelector('#mensagem-finalizacao');
	const imagem = document.querySelector('#imagem-finalizacao');
	const nome = document.querySelector('#nome-finalizacao');
	const descricao = document.querySelector('#descricao-finalizacao');
	const preco = document.querySelector('#preco-finalizacao');
	const metodo = document.querySelector('#metodo-finalizacao');
	const total = document.querySelector('#total-finalizacao');
	const parcelas = document.querySelector('#parcelas-finalizacao');
	const prazo = document.querySelector('#prazo-entrega');

	// Não executa este fluxo em páginas que não possuem a etapa de finalização.
	if (!resumo || !formulario || !mensagemFormularioFinalizacao || !mensagem || !imagem || !nome || !descricao || !preco || !metodo || !total || !parcelas || !prazo) {
		return;
	}

	// Lê o produto, método, total e parcelas recebidos da página de pagamento.
	const dados = obterDadosProduto(new URLSearchParams(window.location.search));
	const metodoEscolhido = new URLSearchParams(window.location.search).get('metodo');
	const totalCompra = Number(new URLSearchParams(window.location.search).get('total'));
	const numeroParcelas = Number(new URLSearchParams(window.location.search).get('parcelas'));

	// Se os dados estiverem ausentes, esconde o checkout e informa o problema.
	if (!dados.nome || !dados.descricao || !dados.imagem || !Number.isFinite(dados.preco) || !metodoEscolhido || !Number.isFinite(totalCompra)) {
		resumo.hidden = true;
		formulario.hidden = true;
		mensagem.hidden = false;
		mensagem.querySelector('h1').textContent = 'Pedido não encontrado';
		mensagem.querySelector('p').textContent = 'Volte aos produtos e escolha um item para continuar.';
		return;
	}

	// Traduz os valores técnicos da URL para os nomes exibidos na tela.
	const nomesMetodos = { pix: 'Pix', debito: 'Débito', credito: 'Crédito' };
	// Preenche o resumo compacto da compra.
	imagem.src = dados.imagem;
	imagem.alt = dados.nome;
	nome.textContent = dados.nome;
	descricao.textContent = dados.descricao;
	preco.textContent = formatarMoeda(dados.preco);
	metodo.textContent = nomesMetodos[metodoEscolhido] || metodoEscolhido;
	parcelas.textContent = metodoEscolhido === 'credito' ? `Parcelamento: ${numeroParcelas}x` : 'Pagamento à vista';
	total.textContent = metodoEscolhido === 'credito'
		? `${formatarMoeda(totalCompra)} em ${numeroParcelas}x de ${formatarMoeda(totalCompra / numeroParcelas)}`
		: `Total com desconto: ${formatarMoeda(totalCompra)}`;
	prazo.textContent = 'Entrega estimada: de 5 a 8 dias úteis';

	// Valida os dados e troca o formulário pela mensagem final após o envio.
	formulario.addEventListener('submit', (event) => {
		event.preventDefault();
		// Exibe as mensagens nativas do navegador quando houver campo inválido.
		if (!formulario.checkValidity()) {
			mensagemFormularioFinalizacao.textContent = 'Preencha seus dados antes de finalizar a compra!';
			mensagemFormularioFinalizacao.className = 'mensagem-erro';
			return;
		}

		// Limpa a mensagem de erro antes de exibir a confirmação final.
		mensagemFormularioFinalizacao.textContent = '';
		mensagemFormularioFinalizacao.className = '';
		resumo.hidden = true;
		formulario.hidden = true;
		mensagem.hidden = false;
	});
};

// ==================== BOTÕES DE COMPRA ====================

// Captura o produto individual e envia seus dados para a página de pagamento.
document.querySelectorAll('a.btn-comprar').forEach((botao) => {
	botao.addEventListener('click', (event) => {
		event.preventDefault();
		// Encontra o bloco do produto relacionado ao botão clicado.
		const produto = botao.closest('.produto-layout');
		const imagem = produto.querySelector('.produto-imagem');
		const nome = produto.querySelector('.produto-info h1').textContent.trim();
		const descricao = produto.querySelector('.produto-descricao').textContent.trim();
		const preco = obterPreco(produto.querySelector('.produto-preco').textContent);
		// Prepara os dados para serem transportados pela URL.
		const parametros = new URLSearchParams({
			nome,
			descricao,
			imagem: new URL(imagem.getAttribute('src'), window.location.href).href,
			preco: String(preco)
		});
		// Redireciona para o pagamento com os dados desse produto específico.
		window.location.href = `../HTML/pagamento.html?${parametros.toString()}`;
	});
});

// Ativa os fluxos que pertencem à página atual.
configurarPagamento();
configurarFinalizacao();

// ==================== FORMULÁRIO DE CONTATO ====================

// Só adiciona o comportamento quando o formulário existe na página atual.
if (formularioContato && mensagemFormulario && mensagemCarregamento) {
	formularioContato.addEventListener('submit', (event) => {
		event.preventDefault();
		// Seleciona todos os campos que precisam ser conferidos.
		const campos = formularioContato.querySelectorAll('input, textarea');
		const formularioCompleto = [...campos].every((campo) => campo.value.trim() !== '') && formularioContato.checkValidity();

		// Impede o envio quando algum campo estiver vazio ou inválido.
		if (!formularioCompleto) {
			mensagemFormulario.textContent = 'Preencha as informações antes de enviar';
			mensagemFormulario.className = 'mensagem-erro';
			return;
		}

		// Exibe sucesso, inicia o carregamento e limpa os campos.
		mensagemFormulario.textContent = 'Agradecemos sua mensagem! Responderemos em breve';
		mensagemFormulario.className = 'mensagem-sucesso';
		mensagemCarregamento.classList.add('visivel');
		formularioContato.reset();

		// Depois do tempo de carregamento, retorna para a página inicial.
		setTimeout(() => {
			window.location.href = '../HTML/index.html';
		}, 4500);
	});
}

// ==================== RETORNO AO CATÁLOGO ====================

// Guarda a posição e a página de origem ao abrir um produto pelo catálogo ou pela home.
document.querySelectorAll('a.produto-card, a.produto').forEach((link) => {
	link.addEventListener('click', () => {
		sessionStorage.setItem(scrollKey, String(window.scrollY));
			sessionStorage.setItem(returnPageKey, window.location.pathname.endsWith('/index.html') ? 'index.html' : 'produtos.html');
	});
});

// Faz o botão Voltar retornar à página de origem do produto.
document.querySelectorAll('a.btn-voltar').forEach((link) => {
	link.addEventListener('click', (event) => {
		event.preventDefault();
		const returnPage = sessionStorage.getItem(returnPageKey) || 'produtos.html';
		window.location.href = `../HTML/${returnPage}`;
	});
});

// Faz o botão Cancelar voltar à página de origem e restaurar o scroll salvo.
document.querySelectorAll('a.btn-cancelar').forEach((link) => {
	link.addEventListener('click', (event) => {
		event.preventDefault();
		const returnPage = sessionStorage.getItem(returnPageKey) || 'produtos.html';
		window.location.href = `../HTML/${returnPage}`;
	});
});

// ==================== RESTAURAÇÃO DA ROLAGEM ====================

// Identifica a página atual para restaurar a posição somente no catálogo ou na home.
const currentPage = window.location.pathname.split('/').pop();
if (currentPage === 'index.html' || currentPage === 'produtos.html') {
	// Recupera a posição salva antes de abrir o produto.
	const savedScroll = sessionStorage.getItem(scrollKey);

	if (savedScroll !== null) {
		// Aguarda o carregamento da página para aplicar a posição corretamente.
		window.addEventListener('load', () => {
			window.scrollTo(0, Number(savedScroll));
			sessionStorage.removeItem(scrollKey);
			sessionStorage.removeItem(returnPageKey);
		});
	}
}