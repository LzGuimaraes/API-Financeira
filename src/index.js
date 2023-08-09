const express = require('express');
const { v4: uuidv4 } = require ('uuid');
const app = express();

const customers = [];

//MiddleWare
function verifyIfExistAccountCPF(request,response,next) {
    const {cpf} = request.headers;

    const customer =  customers.find(customer => customer.cpf ===cpf)

    if (!customer) { 
        return response.status(400).json({error:"Customer not found"})
    }

    request.customer = customer;

    return next();
}

//Função do Balance
function getBalance(statement) {
    const balance = statement.reduce((acc,operation)=>{
        if(operation.type ==='credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);
    return balance;
}

app.use(express.json());

//Criação de Conta
app.post("/account", (request, response) => {
    const {cpf , name }  = request.body;

    const customerAlreadyExist = customers.some(
        (customer) =>  customer.cpf === cpf
    );

    if (customerAlreadyExist) {
        return response.status(400).json({ error: "Customer alredy existis!"})
    }

    customers.push({
        cpf,
        name,
        id:uuidv4(),
        statement: []
    });

    return response.status(201).send();
});

//Forma de procurar o historico da conta 
app.get("/statement",verifyIfExistAccountCPF, (request, response) => {
    const {customer} = request;

    return response.json(customer.statement);
});

//Como fazer deposito na conta
app.post("/deposit",verifyIfExistAccountCPF, (request, response) => {
    const {description, amount} = request.body;
    const {customer} = request;
    
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type:"credit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

//Como Fazer Saque na conta.
app.post("/withdrawal",verifyIfExistAccountCPF, (request, response)=>{
    const {description, amount} = request.body;
    const {customer} = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type:"debit"
    };
    customer.statement.push(statementOperation);

    return response.status(201).send();
});

//Forma de procurar o saldo por data
app.get("/statement/date", verifyIfExistAccountCPF,(request,response)=> {
    const {customer} = request;
    const{ date } = request.query;

    const dateFormat = new Date( date + " 00:00")

    const statement = customer.statement.filter(
    (statement) => 
        statement.created_at.toDateString() === 
        new Date(dateFormat).toDateString()
    );

    return response.json(statement);
});

//Forma de Alterar o nome da conta
app.put("/account", verifyIfExistAccountCPF, (request,response)=> {
    const{name} = request.body;
    const {customer} = request;

    customer.name = name;

    return response.status(201).send();
});

//Forma de procurar informação sobre a conta 
app.get("/account",verifyIfExistAccountCPF, (request,response)=> {
    const {customer} = request;
    return response.json(customer);
})

//Forma de Deletar a Conta
app.delete("/account",verifyIfExistAccountCPF, (request,response)=>{
    const {customer} = request;
    //splice
    customers.splice(customer, 1)

    return response.status(200).json(customers)
});

//Forma de Olhar o saldo da Conta
app.get("/balance",verifyIfExistAccountCPF, (request,response)=> {
    const {customer} = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
});

//Iniciando o servidor
app.listen(3323, () => {
    console.log(`Server is running on http://localhost:${3323}`);
  });

/**
 * GET - Buscar Informações dentro do servidor
 * POST - Inserir uma informação no servidor
 * PUT - Alterar uma informação no servidor
 * Patch - Alterar uma informação especifica
 * DELETE - Deletar uma informação no servidor
 * 
 */

/* Tipos de Parãmetros 

* Route Params=> Identificar um recurso editar/deletar/buscar
* Query Params => Paginação / Filtro
* Body Params => Os objetos inserção/alteração
*/



