const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database(':memory:');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Criação da tabela no banco de dados
db.serialize(() => {
    db.run(`
        CREATE TABLE Tarefas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            custo REAL,
            data_limite TEXT,
            ordem INTEGER UNIQUE
        )
    `);
});

// Rota para listar todas as tarefas
app.get('/api/tarefas', (req, res) => {
    const query = `SELECT id, nome, custo, data_limite, ordem FROM Tarefas ORDER BY ordem ASC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao listar tarefas' });
        }
        res.json({ tarefas: rows });
    });
});


// Rota para criar uma nova tarefa com verificação de nome duplicado
app.post('/api/tarefas', (req, res) => {
    const { nome, custo, data_limite } = req.body;

    // Verifica se o nome da tarefa já existe no banco de dados
    const checkQuery = `SELECT * FROM Tarefas WHERE nome = ?`;
    db.get(checkQuery, [nome], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao verificar o nome da tarefa' });
        }
        if (row) {
            // Se já existe uma tarefa com o mesmo nome, retorna um erro
            return res.status(400).json({ error: 'Já existe uma tarefa com este nome' });
        }

        // Se o nome é único, insere a nova tarefa
        const insertQuery = `INSERT INTO Tarefas (nome, custo, data_limite, ordem) VALUES (?, ?, ?, 
                             (SELECT IFNULL(MAX(ordem), 0) + 1 FROM Tarefas))`;
        db.run(insertQuery, [nome, custo, data_limite], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao inserir tarefa' });
            }
            res.json({ tarefa: { id: this.lastID, nome, custo, data_limite, ordem: this.lastID } });
        });
    });
});
app.post('/api/tarefas/:id/move', (req, res) => {
    const { id } = req.params;
    const { direction } = req.body;

    const getTaskQuery = `SELECT * FROM Tarefas WHERE id = ?`;
    db.get(getTaskQuery, [id], (err, task) => {
        if (err || !task) return res.status(500).json({ error: 'Erro ao obter tarefa' });

        const targetOrder = direction === 'up' ? task.ordem - 1 : task.ordem + 1;
        const swapTaskQuery = `SELECT * FROM Tarefas WHERE ordem = ?`;

        db.get(swapTaskQuery, [targetOrder], (err, swapTask) => {
            if (err || !swapTask) return res.status(500).json({ error: 'Não é possível mover nessa direção' });

            const updateCurrentTaskQuery = `UPDATE Tarefas SET ordem = ? WHERE id = ?`;
            const updateSwapTaskQuery = `UPDATE Tarefas SET ordem = ? WHERE id = ?`;

            db.run(updateCurrentTaskQuery, [targetOrder, task.id], (err) => {
                if (err) return res.status(500).json({ error: 'Erro ao atualizar tarefa' });
                
                db.run(updateSwapTaskQuery, [task.ordem, swapTask.id], (err) => {
                    if (err) return res.status(500).json({ error: 'Erro ao atualizar tarefa' });
                    
                    res.json({ message: 'Ordem atualizada com sucesso' });
                });
            });
        });
    });
});

// Rota para deletar uma tarefa
app.delete('/api/tarefas/:id', (req, res) => {
    const { id } = req.params;
    const deleteQuery = `DELETE FROM Tarefas WHERE id = ?`;
    db.run(deleteQuery, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao excluir tarefa' });
        }
        res.json({ message: 'Tarefa excluída com sucesso' });
    });
});

// Rota para editar uma tarefa
app.put('/api/tarefas/:id', (req, res) => {
    const { id } = req.params;
    const { nome, custo, data_limite } = req.body;

    const checkQuery = `SELECT * FROM Tarefas WHERE nome = ? AND id != ?`;
    db.get(checkQuery, [nome, id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao verificar o nome da tarefa' });
        }
        if (row) {
            return res.status(400).json({ error: 'Já existe uma tarefa com este nome' });
        }

        const updateQuery = `UPDATE Tarefas SET nome = ?, custo = ?, data_limite = ? WHERE id = ?`;
        db.run(updateQuery, [nome, custo, data_limite, id], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar tarefa' });
            }
            res.json({ message: 'Tarefa atualizada com sucesso' });
        });
    });
});

// Inicialização do servidor
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
