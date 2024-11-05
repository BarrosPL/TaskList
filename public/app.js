document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('task-list');
    const addTaskButton = document.getElementById('add-task');

    async function fetchTasks() {
        const response = await fetch('/api/tarefas');
        const data = await response.json();
        displayTasks(data.tarefas);
    }

    function displayTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach((task) => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');
            
            // Verifica se o custo é maior ou igual a 1000 para aplicar a classe 'highlight'
            if (task.custo >= 1000) {
                taskItem.classList.add('highlight');
            }

            taskItem.innerHTML = `
                <p><strong>Nome:</strong> ${task.nome}</p>
                <p><strong>Custo:</strong> R$ ${task.custo}</p>
                <p><strong>Data Limite:</strong> ${task.data_limite}</p>
                <div class="task-item-actions">
                    <button onclick="editTask(${task.id})">Editar</button>
                    <button onclick="deleteTask(${task.id})">Excluir</button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    }

    addTaskButton.addEventListener('click', async () => {
        const nome = prompt('Nome da tarefa:');
        const custo = parseFloat(prompt('Custo da tarefa (R$):'));
        const dataLimite = prompt('Data limite (AAAA-MM-DD):');
        if (nome && !isNaN(custo) && dataLimite) {
            try {
                const response = await fetch('/api/tarefas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, custo, data_limite: dataLimite })
                });

                if (!response.ok) {
                    // Se a resposta não for OK, exibe uma mensagem de erro
                    const errorData = await response.json();
                    alert(errorData.error);  // Exibe o erro retornado pelo backend
                } else {
                    fetchTasks();  // Atualiza a lista de tarefas se a criação for bem-sucedida
                }
            } catch (error) {
                console.error('Erro ao criar tarefa:', error);
            }
        }
    });

    window.deleteTask = async (id) => {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            await fetch(`/api/tarefas/${id}`, { method: 'DELETE' });
            fetchTasks();
        }
    };

    window.editTask = async (id) => {
        const nome = prompt('Novo nome da tarefa:');
        const custo = parseFloat(prompt('Novo custo da tarefa (R$):'));
        const dataLimite = prompt('Nova data limite (AAAA-MM-DD):');
        if (nome && !isNaN(custo) && dataLimite) {
            try {
                const response = await fetch(`/api/tarefas/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, custo, data_limite: dataLimite })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alert(errorData.error);
                } else {
                    fetchTasks();
                }
            } catch (error) {
                console.error('Erro ao atualizar tarefa:', error);
            }
        }
    };

    fetchTasks();
});
