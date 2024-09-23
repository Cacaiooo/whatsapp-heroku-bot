const venom = require("venom-bot");
const axios = require('axios');
const banco = require('./src/banco');

const treinamento = `Você é um atendente e está tirando dúvidas do cliente.
Você realiza um atendimento humanizado, imitando o comportamento humano. Lembre-se, você NÃO É UMA I.A.

sempre dê as boas vindas: Olá, bem-vindo a Fazenda Park Nova Conquista! Como posso te ajudar hoje?

As mensagens precisam ser resumidas! Os textos não podem ser grandes!


mande emoji apenas a cada 3 mensagens que você envia!

jamais corrija a pessoa na maneira de escrever.

Você pode falar sobre o cardápio!!! Fale que tem e que vai mandar o cardápio

Você não pode dar nenhuma informação de quaisquer coisas que não estão relacionadas ao parque, exceto o cardápio e redes sociais! 
Nunca mande a mensagem: "Desculpe, mas só posso enviar o cardápio após você fazer alguma perguntas relacionada ao parque. Como posso te ajudar?"; Ao inves disso fale que tem cardápio

se o cliente falar que sim, pergunte, qual dúvida seria

Caso ja tenha dado as boas-vindas, não repita!

A seguir vou passar algumas perguntas comuns e respostas que você deve se basear:  

Quais são os dias de funcionamento e horários de funcionamento:

Horários de funcionamento são de 09:00 da manhã até 17:00 da tarde

Quanto custa?

O valor de entrada e 30 reais

Crianças pagão a partir de que idade?

Crianças a partir de 3 anos o valor é o mesmo de 30 reais

Tem descontos para grupos?

Para saber mais sobre descontos para grupo, por favor entrar em contato com o gerente: 7399037182

Pode entrar com bebidas e alimentos?

Não pode entrada com bebidas, caixa de som ou alimentos de fora

Pode comemorar aniversário?

Pode comemorar aniversário 

Se pode levar bolo e doces?

É possível levar doce e bolo apenas se for para aniversário 

O parque aceita excursões?

Sim, é necessário acessar as datas e a quantidade de pessoas primeiro, para isso entre contato com a equipe: número da equipe

Aluga o espaço para festa?

Não alugamos o espaço 

Serve almoço?

Sim, temos serviço de restaurante de buffet e a la carte

Qual é o cardápio?

Enviar o cardápio 

Pode entrar com som?

Não pode entrar com som

Tem desconto?

Desconto apenas para grupos, por favor consulte a nossa equipe: número da equipe.

descrição do local:

O parque tem 4 piscinas, tem 1 campo, tem tobogã, espaço para tirar fotos, espaço para tirar fotos com animais, tem espaço com animais, como papagaio, tirolesa, tem parquinho para crianças com balanço´
É um ambiente familiar, aberto

O nome do dono do parque é Jeferson e o gerente é Junior

Localização: Localização 
Ficamos a 15 km de itamaraty sentido gandu a entrada fica na Br101 a esquerda tem um ponto de ônibus,e 2 placas grande do park na entrada 
E a 25km de gandu sentido itamaraty, a entrada fica a 800 metros depois da fazenda paineiras,na BR 101 a entrada fica a direita, na entrada ao lado tem um ponto de ônibus,e 2 placas do Park  grande na entrada

Nosso instagram: @fazendaparknovaconquista, link do instagram: https://www.instagram.com/fazendaparknovaconquista?igsh=MXpkNmJiOTYxMHdw

A nossa reinauguração vai ocorrer no dia 28 de setembro, por conta de uma manuntenção e ampliação do espaço.
`


venom.create ({
    session: "chatGPT_BOT",
    multidevice: true

})
.then((client) => start(client))
.catch((err) => console.log(err));

const header = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-UkJL0aDeO0-01aLxSMBnVb4j7lDNUr7CvdrAqdkJeLT3BlbkFJZlgCxWtFwGQrUqy2MQ9kjC4JYGvytzF2XCvGw6H-UA" 
}

const start = (client) => {
    client.onMessage((message) => {
        const userCadastrado = banco.db.find(numero => numero.num === message.from);
        if(!userCadastrado){
            console.log("Cadastrando usuario");
            banco.db.push({num: message.from, historico : []});
        }
        else{
            console.log("usuario ja cadastrado");
        }

                // 1. Verificação de "localização"
        if (message.body.toLowerCase().includes('localização') || message.body.toLowerCase().includes('endereço')) {
            // Envia a localização usando coordenadas (latitude e longitude)
            client.sendLocation(message.from, '-13.9303110', '-39.4992540', 'Fazenda Park Nova Conquista')
            .then((result) => {
                console.log('Localização enviada com sucesso:', result);
            })
            .catch((error) => {
                console.error('Erro ao enviar a localização:', error);
            });
        }

        // 2. Verificação de "cardápio"
        if (message.body.toLowerCase().includes('cardápio') || message.body.toLowerCase().includes('cardapio')) {
            // Envia a imagem do cardápio
            client.sendImage(
                message.from,
                './images/cardapio.jpg',
                'Cardápio',
                'Aqui está o nosso cardápio!'
            )
            .then((result) => {
                console.log('Imagem do cardápio enviada com sucesso:', result);
            })
            .catch((error) => {
                console.error('Erro ao enviar a imagem do cardápio:', error);
                client.sendText(message.from, 'Desculpe, ocorreu um erro ao tentar enviar o cardápio.');
            });
        }



        const historico = banco.db.find(num => num.num === message.from);
        historico.historico.push("user: " + message.body);
        console.log(historico.historico);

        console.log(banco.db);
        axios.post("https://api.openai.com/v1/chat/completions", {
            "model": "gpt-3.5-turbo",
            "messages": [

                {"role": "system", "content": treinamento},
                {"role": "system", "content": "historico de conversas: " + historico.historico},
                {"role": "user", "content": message.body}
            
            ]

           }, {
              headers: header
            })
                .then((response) => {
               console.log(response.data.choices[0].message.content);
               historico.historico.push("assistent: " + response.data.choices[0].message.content);
               client.sendText(message.from, response.data.choices[0].message.content);
            })
                .catch((err) => {
            if (err.response) {
                console.error("Erro ao chamar a API da OpenAI:", err.response.data, "Status:", err.response.status);
            } else {
                console.error("Erro desconhecido:", err);
            }
       });

    })
}