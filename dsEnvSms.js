function defineStructure() {
	addColumn("ES_DATA");
	addColumn("ES_COD");
	addColumn("ES_CLIENTE");
	addColumn("ES_EMPREENDIMENTO");
	addColumn("ES_NUMERO");	
	addColumn("ES_SUCESSO");	
	addColumn("ES_IDENVIO");	
	addColumn("ES_TIPOSMS");
	addColumn("ES_RESPOSTA");
	
	setKey([ "ES_DATA", "ES_CLIENTE", "ES_EMPREENDIMENTO","ES_NUMERO","ES_TIPOSMS","ES_TIPOSMS"]);
    addIndex([ "ES_DATA"]);
    addIndex([ "ES_CLIENTE" ]);
}
function onSync(lastSyncDate) {
	var ds = DatasetBuilder.newDataset();
	var Dados = new java.util.ArrayList();
    var DadosV = new java.util.ArrayList();
	var dadosEnviados = new Array();
	var executado = false
	var dataInicial, dataFinal
	var contExec = 0

	var data = new Date()

	var dia = data.getDate()
	dia = (dia < 10 ) ?  '0'+dia : dia;

	var mes = (data.getMonth()+1)	
	mes = (mes < 10 ) ?  '0'+mes : mes;

	var ano = data.getFullYear()

	var hora = ''+data.getHours()
	hora = (hora < 10 ) ?  '0'+hora : hora;

	var minutos = data.getMinutes()
	minutos = (minutos < 10 ) ?  '0'+minutos : minutos;

	var segundos = ''+data.getSeconds()
	segundos = (segundos < 10 ) ?  '0'+segundos : segundos;
	
	var mils = data.getMilliseconds()
	mils = (mils < 10 ) ?  '0'+'0'+mils : mils;

	dataInicial = ''+ano+'-'+mes+'-'+dia+'T00:00:00.000-03:00'
	var datafmt = ''+dia+'/'+mes+'/'+ano
	try{
		var mensag
        var dsVenceB = DatasetFactory.getDataset("dsVenceB", null, null, null);
        var codCli = '!',quantidade,nCont=0
        quantidade = dsVenceB.rowsCount
		var codPassado = new Array()
		codPassado.push('000000')
        for (let i = 0; i < quantidade; i++) {
			codCli = dsVenceB.getValue(i, 'VB_CODIGO')
			var retorna = false
			for (let cont = 0; cont < codPassado.length; cont++) {
				if (codCli == codPassado[cont]) {
					retorna = true
					cont = codPassado.length
				}
			}
            if (retorna == false){
                codPassado.push(codCli)
                var empreend = ''
				var cliente = dsVenceB.getValue(i, 'VB_NOME')
                var nomeCliente = ''+dsVenceB.getValue(i, 'VB_NOME');
				nomeCliente = nomeCliente.split(' ')
                log.info('MEULOG INFO codCli =>' + codCli);
				var constraints = new Array()
	            constraints.push(DatasetFactory.createConstraint("VB_CODIGO", codCli, codCli, ConstraintType.MUST));
                var dsVenceB2 = DatasetFactory.getDataset("dsVenceB", null, constraints, null);
                log.info('MEULOG INFO quantidadeB =>' + dsVenceB2.rowsCount);
	            for (let j = 0; j < dsVenceB2.rowsCount; j++) {
                	log.info('MEULOG INFO j =>' + j);
	            	var produto = ''+dsVenceB2.getValue(j, 'VB_PRODUTO')
					produto = produto.split('-')
	                if(empreend != produto[2]){
						empreend = produto[2]
						var constraintsT = new Array()
						constraintsT.push(DatasetFactory.createConstraint("VB_CODIGO", codCli, codCli, ConstraintType.MUST));
						var dsVenceB3 = DatasetFactory.getDataset("dsVenceB", null, constraintsT, null);
						log.info('MEULOG INFO quantidadeB =>' + dsVenceB3.rowsCount);
						var prods = ''
						for (let k = 0; k < dsVenceB3.rowsCount; k++){
							if(empreend == produto[2]){
								prods += ''+dsVenceB3.getValue(k, 'VB_VENCIMENTO')+' | '+dsVenceB3.getValue(k, 'VB_PRODUTO')+' | '+dsVenceB3.getValue(k, 'VB_VALOR')+' |<br/>'
							}
						}
	                    
	                    var numero = '' //numero que será realizado o envio
						var numero1 = ''+dsVenceB2.getValue(j, 'VB_NUMERO1')
						var numero2 = ''+dsVenceB2.getValue(j, 'VB_NUMERO2')
						var numero3 = ''+dsVenceB2.getValue(j, 'VB_NUMERO3')
						// numero = '5519978510627'
						log.info("MEULOG INFO tamanho:"+ numero1.length)
						log.info("MEULOG INFO tamanho:"+ numero2.length)
						log.info("MEULOG INFO tamanho:"+ numero3.length)
						if(numero1.length > 10){
							numero = numero1
						}else if(numero2.length > 10){
							numero = numero2
						}else if(numero3.length > 10){
							numero = numero3
						}else{
							numero = ''
							dadosEnviados.push({
								DATA:datafmt,
								COD:codCli,
								CLIENTE: cliente,
								EMPREENDIMENTO: prods,
								NUMERO: numero,
								SUCESSO: 'Erro ao envio',
								IDENVIO: '',
								TIPOSMS: 'LEMBRETE',
								RESPOSTA: 'ERRO - Cliente não possui número de celular'
							})
							
						}
						log.info("MEULOG INFO numero:"+ numero)
						if(numero != ''){
							var clientService = fluigAPI.getAuthorizeClientService();
							mensag = 'Lembrete '+produto[2]+' - THCM'
							var data = {
								companyId: getValue("WKCompany") + '',
								serviceCode: 'SMS',
								endpoint: '/send',
								method: 'post',// 'delete', 'patch', 'put', 'get'     
								timeoutService: '200', // segundos
								params: {
									'Sender': 'THCM',
									'Receivers': numero,
									'Content': 'Lembrete '+produto[2]+' - THCM\nGostaríamos de lembrar que a sua parcela vence amanhã. Efetue o pagamento ate o vencimento. Em caso tiver alguma dúvida e so entrar em contato conosco. 0800 777 9600'
								},
								options: {
									encoding: 'UTF-8',
									mediaType: 'application/json',
									useSSL: true                
								},
								headers: {
									ContentType: 'application/json;charset=UTF-8'
								}
							}
							var vo = clientService.invoke(JSON.stringify(data));
							log.info('MEULOG INFO consulta =>' + vo.getResult());
							if (vo.getResult() == null || vo.getResult().isEmpty()) {
								log.info("Retorno está vazio");         
							}else{
								ret = JSON.parse(vo.getResult());
								if(ret.Success == 'true' || ret.Success == true){
									idMensagem = ret.Object.requestUniqueId
									dadosEnviados.push({
										DATA:datafmt,
										COD:codCli,
										CLIENTE: cliente,
										EMPREENDIMENTO: prods,
										NUMERO: numero,
										SUCESSO: '',
										IDENVIO: idMensagem,
										TIPOSMS: 'LEMBRETE',
										RESPOSTA: ''
									})
									
								}else{
									dadosEnviados.push({
										DATA:datafmt,
										COD:codCli,
										CLIENTE: cliente,
										EMPREENDIMENTO: prods,
										NUMERO: numero,
										SUCESSO: 'Não entregue',
										IDENVIO: '',
										TIPOSMS: 'LEMBRETE',
										RESPOSTA: 'ERRO - ' + ret.Object.Message
									})
								}
							}
						}
	            	}               	                
	            }                
            }
        }
		var dsVenceD = DatasetFactory.getDataset("dsVenceD", null, null, null);
        var codCli = '!',quantidade,nCont=0
        quantidade = dsVenceD.rowsCount
		var codPassado = new Array()
		codPassado.push('000000')
        for (let i = 0; i < quantidade; i++) {
			codCli = dsVenceD.getValue(i, 'VD_CODIGO')
			var retorna = false
			for (let cont = 0; cont < codPassado.length; cont++) {
				if (codCli == codPassado[cont]) {
					retorna = true
					cont = codPassado.length
				}
			}
            if (retorna == false){
                codPassado.push(codCli)
                var empreend = ''
				var cliente = dsVenceD.getValue(i, 'VD_NOME')
                var nomeCliente = ''+dsVenceD.getValue(i, 'VD_NOME');
				nomeCliente = nomeCliente.split(' ')
                log.info('MEULOG INFO codCli =>' + codCli);
				var constraints = new Array()
	            constraints.push(DatasetFactory.createConstraint("VD_CODIGO", codCli, codCli, ConstraintType.MUST));
                var dsVenceD2 = DatasetFactory.getDataset("dsVenceD", null, constraints, null);
                log.info('MEULOG INFO quantidadeB =>' + dsVenceD2.rowsCount);
	            for (let j = 0; j < dsVenceD2.rowsCount; j++) {
                	log.info('MEULOG INFO j =>' + j);
	            	var produto = ''+dsVenceD2.getValue(j, 'VD_PRODUTO')
					produto = produto.split('-')
	                if(empreend != produto[2]){
	                    empreend = produto[2]

						var constraintsT = new Array()
						constraintsT.push(DatasetFactory.createConstraint("VD_CODIGO", codCli, codCli, ConstraintType.MUST));
						var dsVenceD3 = DatasetFactory.getDataset("dsVenceD", null, constraintsT, null);
						log.info('MEULOG INFO quantidadeB =>' + dsVenceD3.rowsCount);
						var prods = ''
						for (let k = 0; k < dsVenceD3.rowsCount; k++){
							if(empreend == produto[2]){
								prods += ''+dsVenceD3.getValue(k, 'VD_VENCIMENTO')+' | '+dsVenceD3.getValue(k, 'VD_PRODUTO')+' | '+dsVenceD3.getValue(k, 'VD_VALOR')+' |<br>\n'
							}
						}
	                    var numero 
						var numero1 = ''+dsVenceD2.getValue(j, 'VD_NUMERO1')
						var numero2 = ''+dsVenceD2.getValue(j, 'VD_NUMERO2')
						var numero3 = ''+dsVenceD2.getValue(j, 'VD_NUMERO3')
						// numero = '19978510627'
						log.info("MEULOG INFO tamanho:"+ numero1.length)
						log.info("MEULOG INFO tamanho:"+ numero2.length)
						log.info("MEULOG INFO tamanho:"+ numero3.length)
						if(numero1.length > 10){
							numero = numero1
						}else if(numero2.length > 10){
							numero = numero2
						}else if(numero3.length > 10){
							numero = numero3
						}else{
							numero = ''
							var addDados = new java.util.HashMap()
							dadosEnviados.push({
								DATA:datafmt,
								COD:codCli,
								CLIENTE: cliente,
								EMPREENDIMENTO: prods,
								NUMERO: numero,
								SUCESSO: 'Erro ao envio',
								IDENVIO: '',
								TIPOSMS: 'AVISO',
								RESPOSTA: 'ERRO - Cliente não possui número de celular'
							})
						}
						log.info("MEULOG INFO numero:"+ numero)
						if(numero != ''){
							mensag = 'Lembrete '+produto[2]+' - THCM'
							var clientService = fluigAPI.getAuthorizeClientService();
							var data = {
								companyId: getValue("WKCompany") + '',
								serviceCode: 'SMS',
								endpoint: '/send',
								method: 'post',// 'delete', 'patch', 'put', 'get'     
								timeoutService: '200', // segundos
								params: {
									'Sender': 'THCM',
									'Receivers': numero,
									'Content': 'Aviso '+produto[2]+'- THCM\nAté o momento não identificamos o pagamento da sua parcela. Caso pagamento já tenha sido efetuado, por favor desconsidere este aviso. Em caso de dúvida, entrar em contato conosco. 0800 777 9600'
								},
								options: {
									encoding: 'UTF-8',
									mediaType: 'application/json',
									useSSL: true                
								},
								headers: {
									ContentType: 'application/json;charset=UTF-8'
								}
							}
							var vo = clientService.invoke(JSON.stringify(data));
							log.info('MEULOG INFO consulta =>' + vo.getResult());
							if (vo.getResult() == null || vo.getResult().isEmpty()) {
								log.info("Retorno está vazio");   
								      
							}else{
								ret = JSON.parse(vo.getResult());
								if(ret.Success == 'true' || ret.Success == true){
									idMensagem = ret.Object.requestUniqueId
									dadosEnviados.push({
										DATA:datafmt,
										COD:codCli,
										CLIENTE: cliente,
										EMPREENDIMENTO: prods,
										NUMERO: numero,
										SUCESSO: '',
										IDENVIO: idMensagem,
										TIPOSMS: 'AVISO',
										RESPOSTA: ''
									})
								}else{
									dadosEnviados.push({
										DATA:datafmt,
										COD:codCli,
										CLIENTE: cliente,
										EMPREENDIMENTO: prods,
										NUMERO: numero,
										SUCESSO: 'Não entregue',
										IDENVIO: '',
										TIPOSMS: 'AVISO',
										RESPOSTA: 'ERRO - ' + ret.Object.Message
									})
								}
								
							}
						}
	            	}               	                
	            }                
            }
        }
		var clientService = fluigAPI.getAuthorizeClientService();

		
		for (let wait = 0; wait < 109142858; wait++) {			
		}
		var data = new Date()

		var dia = data.getDate()
		dia = (dia < 10 ) ?  '0'+dia : dia;

		var mes = (data.getMonth()+1)	
		mes = (mes < 10 ) ?  '0'+mes : mes;

		var ano = data.getFullYear()

		var hora = ''+data.getHours()
		hora = (hora < 10 ) ?  '0'+hora : hora;

		var minutos = data.getMinutes()
		minutos = (minutos < 10 ) ?  '0'+minutos : minutos;

		var segundos = ''+data.getSeconds()
		segundos = (segundos < 10 ) ?  '0'+segundos : segundos;
		
		var mils = data.getMilliseconds()
		mils = (mils < 10 ) ?  '0'+'0'+mils : mils;

		dataFinal = ''+ano+'-'+mes+'-'+dia+'T'+'23:59:59.999-03:00'
		
		log.info('MEULOG INFO Data Inicial: '+ dataInicial);
		log.info('MEULOG INFO Data Final: '+ dataFinal);
		
		var data = {
			companyId: getValue("WKCompany") + '',
			serviceCode: 'SMS',
			endpoint: '/detailedreporting?StartDate='+dataInicial+'&EndDate='+dataFinal+'&Delivered=all',
			method: 'get',// 'delete', 'patch', 'put', 'get', post     
			timeoutService: '200', // segundos
			options: {
				encoding: 'UTF-8',
				mediaType: 'application/json',
				useSSL: true                
			},
			headers: {
				ContentType: 'application/json;charset=UTF-8'
			}
		}
		// var clientServiceV = fluigAPI.getAuthorizeClientService();
		var vo = clientService.invoke(JSON.stringify(data))
		if (vo.getResult() == null || vo.getResult().isEmpty()) {
			log.info("Retorno está vazio");         
		}else{
			executado = true
			var ret = JSON.parse(vo.getResult());
			log.info('MEULOG INFO rel: '+vo.getResult());
			log.info("MEULOG INFO dadosEnviados.length: "+dadosEnviados.length)
			for (let index = 0; index < dadosEnviados.length; index++) {
				log.info("MEULOG INFO numero: "+dadosEnviados[index].NUMERO)
				if(dadosEnviados[index].NUMERO != '' ){
					log.info("MEULOG INFO ret.Object.length: "+ret.Object.length)
					var veriNum = false
					for(let contador=0; contador < ret.Object.length; contador++){
						numTel = ''+ret.Object[contador].Receiver
						numTel = numTel.substring(2)
						numTelAt = ''+dadosEnviados[index].NUMERO
						numTelAt = (numTelAt.substr(0,1) == "0" ? numTelAt.substr(1) : numTelAt)
						if(numTel == numTelAt){
							veriNum = true
							if(ret.Object[contador].Status == "Error" || ret.Object[contador].DlrStatus == "Undelivered"){
								ds.addRow([
									dadosEnviados[index].DATA,
									dadosEnviados[index].COD,
									dadosEnviados[index].CLIENTE,
									dadosEnviados[index].EMPREENDIMENTO,
									dadosEnviados[index].NUMERO,
									'Erro ao envio',
									dadosEnviados[index].IDENVIO,
									dadosEnviados[index].TIPOSMS,
									'ERRO - ' +ret.Object[contador].SystemMessage
								])
								var dadoI = new java.util.HashMap();
								dadoI.put("Codigo", dadosEnviados[index].COD);
								dadoI.put("Cliente", dadosEnviados[index].CLIENTE);
								dadoI.put("dadosCli", dadosEnviados[index].EMPREENDIMENTO);
								dadoI.put("dataEnvio", dadosEnviados[index].DATA);
								dadoI.put("local", dadosEnviados[index].NUMERO);
								dadoI.put("tipo", dadosEnviados[index].TIPOSMS);
								dadoI.put("Resposta", 'ERRO - ' +ret.Object[contador].SystemMessage );
								DadosV.add(dadoI) 
							}else{
								ds.addRow([
									dadosEnviados[index].DATA,
									dadosEnviados[index].COD,
									dadosEnviados[index].CLIENTE,
									dadosEnviados[index].EMPREENDIMENTO,
									dadosEnviados[index].NUMERO,
									'Enviado com sucesso',
									dadosEnviados[index].IDENVIO,
									dadosEnviados[index].TIPOSMS,
									'Sucesso - ' +ret.Object[contador].SystemMessage
								])
								var dadoI = new java.util.HashMap();
								dadoI.put("Codigo", dadosEnviados[index].COD);
								dadoI.put("Cliente", dadosEnviados[index].CLIENTE);
								dadoI.put("dadosCli", dadosEnviados[index].EMPREENDIMENTO);
								dadoI.put("dataEnvio", dadosEnviados[index].DATA);
								dadoI.put("local", dadosEnviados[index].NUMERO);
								dadoI.put("tipo", dadosEnviados[index].TIPOSMS);
								dadoI.put("Resposta", 'Sucesso - ' +ret.Object[contador].SystemMessage );
								Dados.add(dadoI) 
							}
							contador = ret.Object.length+1							
						}
						
					}
					if (veriNum == false){
						ds.addRow([
							dadosEnviados[index].DATA,
							dadosEnviados[index].COD,
							dadosEnviados[index].CLIENTE,
							dadosEnviados[index].EMPREENDIMENTO,
							dadosEnviados[index].NUMERO,
							'Erro ao envio',
							'',
							dadosEnviados[index].TIPOSMS,
							'ERRO - Numero não realizado o envio'
						])
						var dadoI = new java.util.HashMap();
						dadoI.put("Codigo", dadosEnviados[index].COD);
						dadoI.put("Cliente", dadosEnviados[index].CLIENTE);
						dadoI.put("dadosCli", dadosEnviados[index].EMPREENDIMENTO);
						dadoI.put("dataEnvio", dadosEnviados[index].DATA);
						dadoI.put("local", dadosEnviados[index].NUMERO);
						dadoI.put("tipo", dadosEnviados[index].TIPOSMS);
						dadoI.put("Resposta", 'ERRO - Numero não realizado o envio' );
						DadosV.add(dadoI) 
					}
				}else{
					ds.addRow([
						dadosEnviados[index].DATA,
						dadosEnviados[index].COD,
						dadosEnviados[index].CLIENTE,
						dadosEnviados[index].EMPREENDIMENTO,
						dadosEnviados[index].NUMERO,
						dadosEnviados[index].SUCESSO,
						dadosEnviados[index].IDENVIO,
						dadosEnviados[index].TIPOSMS,
						dadosEnviados[index].RESPOSTA
					])
					var dadoI = new java.util.HashMap();
					dadoI.put("Codigo", dadosEnviados[index].COD);
					dadoI.put("Cliente", dadosEnviados[index].CLIENTE);
					dadoI.put("dadosCli", dadosEnviados[index].EMPREENDIMENTO);
					dadoI.put("dataEnvio", dadosEnviados[index].DATA);
					dadoI.put("local", dadosEnviados[index].NUMERO);
					dadoI.put("tipo", dadosEnviados[index].TIPOSMS);
					dadoI.put("Resposta", dadosEnviados[index].RESPOSTA );
					DadosV.add(dadoI) 
				}
			}
		}
		var dadoI = new java.util.HashMap();
        dadoI.put("Codigo", ' ');
		dadoI.put("Cliente", ' ');
		dadoI.put("dadosCli", ' ');
		dadoI.put("dataEnvio", ' ');
		dadoI.put("local", ' ');
		dadoI.put("tipo", ' ');
		dadoI.put("Resposta", ' ' );
        DadosV.add(dadoI) 

		dadoI.put("Codigo", ' ');
		dadoI.put("Cliente", ' ');
		dadoI.put("dadosCli", ' ');
		dadoI.put("dataEnvio", ' ');
		dadoI.put("local", ' ');
		dadoI.put("tipo", ' ');
		dadoI.put("Resposta", ' ' );
        Dados.add(dadoI) 
        var parametros = new java.util.HashMap();
        parametros.put("ENVIO","SMS");
        parametros.put("DadosV",DadosV);
        parametros.put("Dados",Dados);
        parametros.put("envioTable",'sms');
        parametros.put("subject", "Envio de log de envio dos SMS para os clientes");
        var destinatarios = new java.util.ArrayList();  
        destinatarios.add("financeiro@thcm.com.br");
        destinatarios.add("tic@thcm.com.br");
        notifier.notify("admin", "email_avisoLog", parametros, destinatarios, "text/html");
    }catch(e){
        log.info("MEULOG ERRO SMS: "+e)
    }
	while (executado == false) {
		
		try {
			log.info('MEULOG INFO Data Inicial: '+ dataInicial);
			log.info('MEULOG INFO Data Final: '+ dataFinal);
			contExec++;
			for (let wait = 0; wait < 109142858; wait++) {			
			}
			var dataR = {
				companyId: getValue("WKCompany") + '',
				serviceCode: 'SMS',
				endpoint: '/detailedreporting?StartDate='+dataInicial+'&EndDate='+dataFinal+'&Delivered=all',
				method: 'get',// 'delete', 'patch', 'put', 'get', post     
				timeoutService: '200', // segundos
				options: {
					encoding: 'UTF-8',
					mediaType: 'application/json',
					useSSL: true                
				},
				headers: {
					ContentType: 'application/json;charset=UTF-8'
				}
			}
			var clientServiceV = fluigAPI.getAuthorizeClientService();
			var vo = clientServiceV.invoke(JSON.stringify(dataR));
			if (vo.getResult() == null || vo.getResult().isEmpty()) {
				log.info("Retorno está vazio");         
			}else{
				executado = true
				var ret = JSON.parse(vo.getResult());
				log.info('MEULOG INFO rel: '+vo.getResult());
				log.info("MEULOG INFO dadosEnviados.length: "+dadosEnviados.length)
				for (let index = 0; index < dadosEnviados.length; index++) {
					log.info("MEULOG INFO numero: "+dadosEnviados[index].NUMERO)
					if(dadosEnviados[index].NUMERO != '' ){
						log.info("MEULOG INFO ret.Object.length: "+ret.Object.length)
						var veriNum = false
						for(let contador=0; contador < ret.Object.length; contador++){
							numTel = ''+ret.Object[contador].Receiver
							numTel = numTel.substring(2)
							numTelAt = ''+dadosEnviados[index].NUMERO
							numTelAt = (numTelAt.substr(0,1) == "0" ? numTelAt.substr(1) : numTelAt)
							if(numTel == numTelAt){
								veriNum = true
								if(ret.Object[contador].Status == "Error" || ret.Object[contador].DlrStatus == "Undelivered"){
									ds.addRow([
										dadosEnviados[index].DATA,
										dadosEnviados[index].COD,
										dadosEnviados[index].CLIENTE,
										dadosEnviados[index].EMPREENDIMENTO,
										dadosEnviados[index].NUMERO,
										'Erro ao envio',
										dadosEnviados[index].IDENVIO,
										dadosEnviados[index].TIPOSMS,
										'ERRO - ' +ret.Object[contador].SystemMessage
									])
									var dadoI = new java.util.HashMap();
									dadoI.put("Codigo", dadosEnviados[index].COD);
									dadoI.put("Cliente", dadosEnviados[index].CLIENTE);
									dadoI.put("dadosCli", dadosEnviados[index].EMPREENDIMENTO);
									dadoI.put("dataEnvio", dadosEnviados[index].DATA);
									dadoI.put("local", dadosEnviados[index].NUMERO);
									dadoI.put("tipo", dadosEnviados[index].TIPOSMS);
									dadoI.put("Resposta", 'ERRO - ' +ret.Object[contador].SystemMessage );
									DadosV.add(dadoI) 
								}else{
									ds.addRow([
										dadosEnviados[index].DATA,
										dadosEnviados[index].COD,
										dadosEnviados[index].CLIENTE,
										dadosEnviados[index].EMPREENDIMENTO,
										dadosEnviados[index].NUMERO,
										'Enviado com sucesso',
										dadosEnviados[index].IDENVIO,
										dadosEnviados[index].TIPOSMS,
										'Sucesso - ' +ret.Object[contador].SystemMessage
									])
									var dadoI = new java.util.HashMap();
									dadoI.put("Codigo", dadosEnviados[index].COD);
									dadoI.put("Cliente", dadosEnviados[index].CLIENTE);
									dadoI.put("dadosCli", dadosEnviados[index].EMPREENDIMENTO);
									dadoI.put("dataEnvio", dadosEnviados[index].DATA);
									dadoI.put("local", dadosEnviados[index].NUMERO);
									dadoI.put("tipo", dadosEnviados[index].TIPOSMS);
									dadoI.put("Resposta", 'Sucesso - ' +ret.Object[contador].SystemMessage );
									Dados.add(dadoI) 
								}
								contador = ret.Object.length+1							
							}
							
						}
						if (veriNum == false){
							ds.addRow([
								dadosEnviados[index].DATA,
								dadosEnviados[index].COD,
								dadosEnviados[index].CLIENTE,
								dadosEnviados[index].EMPREENDIMENTO,
								dadosEnviados[index].NUMERO,
								'Erro ao envio',
								'',
								dadosEnviados[index].TIPOSMS,
								'ERRO - Numero não realizado o envio'
							])
							var dadoI = new java.util.HashMap();
							dadoI.put("Codigo", dadosEnviados[index].COD);
							dadoI.put("Cliente", dadosEnviados[index].CLIENTE);
							dadoI.put("dadosCli", dadosEnviados[index].EMPREENDIMENTO);
							dadoI.put("dataEnvio", dadosEnviados[index].DATA);
							dadoI.put("local", dadosEnviados[index].NUMERO);
							dadoI.put("tipo", dadosEnviados[index].TIPOSMS);
							dadoI.put("Resposta", 'ERRO - Numero não realizado o envio' );
							DadosV.add(dadoI) 
						}
					}else{
						ds.addRow([
							dadosEnviados[index].DATA,
							dadosEnviados[index].COD,
							dadosEnviados[index].CLIENTE,
							dadosEnviados[index].EMPREENDIMENTO,
							dadosEnviados[index].NUMERO,
							dadosEnviados[index].SUCESSO,
							dadosEnviados[index].IDENVIO,
							dadosEnviados[index].TIPOSMS,
							dadosEnviados[index].RESPOSTA
						])
						var dadoI = new java.util.HashMap();
						dadoI.put("Codigo", dadosEnviados[index].COD);
						dadoI.put("Cliente", dadosEnviados[index].CLIENTE);
						dadoI.put("dadosCli", dadosEnviados[index].EMPREENDIMENTO);
						dadoI.put("dataEnvio", dadosEnviados[index].DATA);
						dadoI.put("local", dadosEnviados[index].NUMERO);
						dadoI.put("tipo", dadosEnviados[index].TIPOSMS);
						dadoI.put("Resposta", dadosEnviados[index].RESPOSTA );
						DadosV.add(dadoI) 
					}
				}
			}
			var dadoI = new java.util.HashMap();
			dadoI.put("Codigo", ' ');
			dadoI.put("Cliente", ' ');
			dadoI.put("dadosCli", ' ');
			dadoI.put("dataEnvio", ' ');
			dadoI.put("local", ' ');
			dadoI.put("tipo", ' ');
			dadoI.put("Resposta", ' ' );
			DadosV.add(dadoI) 

			dadoI.put("Codigo", ' ');
			dadoI.put("Cliente", ' ');
			dadoI.put("dadosCli", ' ');
			dadoI.put("dataEnvio", ' ');
			dadoI.put("local", ' ');
			dadoI.put("tipo", ' ');
			dadoI.put("Resposta", ' ' );
			Dados.add(dadoI) 
			var parametros = new java.util.HashMap();
			parametros.put("ENVIO","SMS");
			parametros.put("DadosV",DadosV);
			parametros.put("Dados",Dados);
			parametros.put("envioTable",'sms');
			parametros.put("subject", "Envio de log de envio dos SMS para os clientes");
			var destinatarios = new java.util.ArrayList();  
			destinatarios.add("financeiro@thcm.com.br");
			destinatarios.add("tic@thcm.com.br");
			notifier.notify("admin", "email_avisoLog", parametros, destinatarios, "text/html");
		} catch (error) {
			if (contExec == 100) {
				log.info("MEULOG ERRO SMS 2: contExec="+contExec +"Erro= "+e)
			}
		}
	}
	log.info(executado)
	if (executado == false){
		log.info("MEULOG INFO entro no: "+dadosEnviados[index].NUMERO)
		for (let index = 0; index < dadosEnviados.length; index++) {
			log.info("MEULOG INFO numero: "+dadosEnviados[index].NUMERO)
			ds.addRow([
				dadosEnviados[index].DATA,
				dadosEnviados[index].COD,
				dadosEnviados[index].CLIENTE,
				dadosEnviados[index].EMPREENDIMENTO,
				dadosEnviados[index].NUMERO,
				'Não Executado',
				dadosEnviados[index].IDENVIO,
				dadosEnviados[index].TIPOSMS,
				'Não Executado'
			])
		}
	}

	return ds

}
function createDataset(fields, constraints, sortFields) {
	var ds = DatasetBuilder.newDataset();

	ds.addColumn("ES_DATA");
	ds.addColumn("ES_COD");
	ds.addColumn("ES_CLIENTE");
	ds.addColumn("ES_EMPREENDIMENTO");
	ds.addColumn("ES_NUMERO");	
	ds.addColumn("ES_SUCESSO");	
	ds.addColumn("ES_IDENVIO");	
	ds.addColumn("ES_TIPOSMS");	
	ds.addColumn("ES_RESPOSTA");	


	if(constraints != null){
		for (var i = 0; i < constraints.length; i++) {
			if (constraints[i].fieldName == "ES_DATA") { 
				dataIni = ''+constraints[i].initialValue;
				dataFim = ''+constraints[i].finalValue;
			}else if (constraints[i].fieldName == "ES_COD"){
				codIni = ''+constraints[i].initialValue;
				codFim = ''+constraints[i].finalValue; 
			}else if (constraints[i].fieldName == "ES_SUCESSO"){
				sucess = ''+constraints[i].initialValue;
			}
		}
	}
	dataFim = (dataFim == '' || dataFim == null ) ?  dataIni : dataFim;
	codFim  =  (codFim == '' || codFim == null ) ?  codIni : codFim;

	var dataset2 = DatasetFactory.getDataset("dsEnvSms", null, null, null); // busca o dataset completo
	if(dataset2.rowsCount > 0){
		for (let i = 0; i < dataset2.rowsCount; i++) {
			if((dataIni != null ||  dataIni != '') || ((codIni != null ||  codIni != ''))){
				var data1 = dataIni.split('/')
				var dataFmtIni = data1[3]+data1[2]+data1[1]
				var data2 = dataFim.split('/')
				var dataFmtFim = data2[3]+data2[2]+data2[1]
				var data3 = ''+dataset2.getValue(i, 'ES_DATA')
				data3 = data3.split('/')
				var dataFmtAtu = data3[3]+data3[2]+data3[1]
				var codAtu = parseInt(dataset2.getValue(i, 'ES_COD'))
				codIni = parseInt(codIni)
				codFim = parseInt(codFim)
				if((dataFmtIni != null ||  dataFmtIni != '') && ((codIni != null ||  codIni != '')) && ((sucess != null ||  sucess != ''))){
					if((dataFmtAtu >= dataFmtIni && dataFmtAtu <= dataFmtFim) && (codAtu >= codIni && codAtu <= codFim) && (sucess == dataset2.getValue(i, 'ES_SUCESSO'))){
						ds.addRow([
							dataset2.getValue(i, 'ES_DATA'), 
							dataset2.getValue(i, 'ES_COD'),
							dataset2.getValue(i, 'ES_CLIENTE'), 
							dataset2.getValue(i, 'ES_EMPREENDIMENTO'), 
							dataset2.getValue(i, 'ES_NUMERO'),
							dataset2.getValue(i, 'ES_SUCESSO'), 
							dataset2.getValue(i, 'ES_IDENVIO'),
							dataset2.getValue(i, 'ES_TIPOSMS'),
							dataset2.getValue(i, 'ES_RESPOSTA')
						])        
					}
				}else if((dataFmtIni != null ||  dataFmtIni != '') && ((codIni != null ||  codIni != '')) && ((sucess == null ||  sucess == ''))){
					if((dataFmtAtu >= dataFmtIni && dataFmtAtu <= dataFmtFim) && (codAtu >= codIni && codAtu <= codFim)) {
						ds.addRow([
							dataset2.getValue(i, 'ES_DATA'), 
							dataset2.getValue(i, 'ES_COD'),
							dataset2.getValue(i, 'ES_CLIENTE'), 
							dataset2.getValue(i, 'ES_EMPREENDIMENTO'), 
							dataset2.getValue(i, 'ES_NUMERO'),
							dataset2.getValue(i, 'ES_SUCESSO'), 
							dataset2.getValue(i, 'ES_IDENVIO'),
							dataset2.getValue(i, 'ES_TIPOSMS'),
							dataset2.getValue(i, 'ES_RESPOSTA')
						])        
					}
				}else if((dataFmtIni != null ||  dataFmtIni != '') && ((codIni == null ||  codIni == '')) && ((sucess != null ||  sucess != ''))){
					if(dataFmtAtu >= dataFmtIni && dataFmtAtu <= dataFmtFim && (sucess == dataset2.getValue(i, 'ES_SUCESSO'))) {
						ds.addRow([
							dataset2.getValue(i, 'ES_DATA'), 
							dataset2.getValue(i, 'ES_COD'),
							dataset2.getValue(i, 'ES_CLIENTE'), 
							dataset2.getValue(i, 'ES_EMPREENDIMENTO'), 
							dataset2.getValue(i, 'ES_NUMERO'),
							dataset2.getValue(i, 'ES_SUCESSO'), 
							dataset2.getValue(i, 'ES_IDENVIO'),
							dataset2.getValue(i, 'ES_TIPOSMS'),
							dataset2.getValue(i, 'ES_RESPOSTA')
						])        
					}
				}else if((dataFmtIni != null ||  dataFmtIni != '') && ((codIni != null ||  codIni == '')) && ((sucess == null ||  sucess == ''))){
					if(dataFmtAtu >= dataFmtIni && dataFmtAtu <= dataFmtFim ) {
						ds.addRow([
							dataset2.getValue(i, 'ES_DATA'), 
							dataset2.getValue(i, 'ES_COD'),
							dataset2.getValue(i, 'ES_CLIENTE'), 
							dataset2.getValue(i, 'ES_EMPREENDIMENTO'), 
							dataset2.getValue(i, 'ES_NUMERO'),
							dataset2.getValue(i, 'ES_SUCESSO'), 
							dataset2.getValue(i, 'ES_IDENVIO'),
							dataset2.getValue(i, 'ES_TIPOSMS'),
							dataset2.getValue(i, 'ES_RESPOSTA')
						])        
					}
				}else if((dataFmtIni == null ||  dataFmtIni != '') && ((codIni != null ||  codIni != '')) && ((sucess != null ||  sucess != ''))){
					if((codAtu >= codIni && codAtu <= codFim) && (sucess == dataset2.getValue(i, 'ES_SUCESSO'))) {
						ds.addRow([
							dataset2.getValue(i, 'ES_DATA'), 
							dataset2.getValue(i, 'ES_COD'),
							dataset2.getValue(i, 'ES_CLIENTE'), 
							dataset2.getValue(i, 'ES_EMPREENDIMENTO'), 
							dataset2.getValue(i, 'ES_NUMERO'),
							dataset2.getValue(i, 'ES_SUCESSO'), 
							dataset2.getValue(i, 'ES_IDENVIO'),
							dataset2.getValue(i, 'ES_TIPOSMS'),
							dataset2.getValue(i, 'ES_RESPOSTA')
						])        
					}
				}else if((dataFmtIni == null ||  dataFmtIni != '') && ((codIni != null ||  codIni == '')) && ((sucess == null ||  sucess == ''))){
					if((codAtu >= codIni && codAtu <= codFim)) {
						ds.addRow([
							dataset2.getValue(i, 'ES_DATA'), 
							dataset2.getValue(i, 'ES_COD'),
							dataset2.getValue(i, 'ES_CLIENTE'), 
							dataset2.getValue(i, 'ES_EMPREENDIMENTO'), 
							dataset2.getValue(i, 'ES_NUMERO'),
							dataset2.getValue(i, 'ES_SUCESSO'), 
							dataset2.getValue(i, 'ES_IDENVIO'),
							dataset2.getValue(i, 'ES_TIPOSMS'),
							dataset2.getValue(i, 'ES_RESPOSTA')
						])        
					}
				}else if((dataFmtIni == null ||  dataFmtIni != '') && ((codIni != null ||  codIni == '')) && ((sucess == null ||  sucess == ''))){
					if((sucess == dataset2.getValue(i, 'ES_SUCESSO'))) {
						ds.addRow([
							dataset2.getValue(i, 'ES_DATA'), 
							dataset2.getValue(i, 'ES_COD'),
							dataset2.getValue(i, 'ES_CLIENTE'), 
							dataset2.getValue(i, 'ES_EMPREENDIMENTO'), 
							dataset2.getValue(i, 'ES_NUMERO'),
							dataset2.getValue(i, 'ES_SUCESSO'), 
							dataset2.getValue(i, 'ES_IDENVIO'),
							dataset2.getValue(i, 'ES_TIPOSMS'),
							dataset2.getValue(i, 'ES_RESPOSTA')
						])        
					}
				}
			}else{
				ds.addRow([
					dataset2.getValue(i, 'ES_DATA'), 
					dataset2.getValue(i, 'ES_COD'),
					dataset2.getValue(i, 'ES_CLIENTE'), 
					dataset2.getValue(i, 'ES_EMPREENDIMENTO'), 
					dataset2.getValue(i, 'ES_NUMERO'),
					dataset2.getValue(i, 'ES_SUCESSO'), 
					dataset2.getValue(i, 'ES_IDENVIO'),
					dataset2.getValue(i, 'ES_TIPOSMS'),
					dataset2.getValue(i, 'ES_RESPOSTA')
				])        
			}                    
		}    
	}
      
    
	
	return ds
}function onMobileSync(user) {

}

