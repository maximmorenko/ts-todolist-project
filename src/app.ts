type ID = string | number;

interface Todo {
    userId: ID;
    id: ID;
    title: string;
    completed: boolean
}

interface User {
    id: ID;
    name: string;
}

(function() {
    // Globals
    const todoList = document.getElementById('todo-list');
    const userSelect = document.getElementById('user-todo');
    const form = document.querySelector('form'); //HTMLFormElement | null
    let todos: Todo[] = [];
    let users: User[] = [];

    // Attach Events
    document.addEventListener('DOMContentLoaded', initApp);
    // так как формы может не быть, то добавим проверку, form?
    // если она есть, то добавляем событие прослушки
    form?.addEventListener('submit', handleSubmit);

    // Basic Logic
    function getUserName(userId: ID) {
        const user = users.find((u) => u.id === userId); //User | undefined
        // так как массив юзеров может быть пустой, то получим undefined
        // если добавить в конце знак восклизания, который скажет TS что user точно есть, так стабртает но это опасно
        // сделаем проверку
        // если юзер есть, user? то возвращаем его имя либо пустую строку
        return user?.name || '';
    }

    function printTodo({ id, userId, title, completed }: Todo) {
        const li = document.createElement('li');
        li.className = 'todo-item';
        // так как тип ID задан как строка либо число, и при undefined TS ругается , то конвертнем id в строку
        // для этого воспользуемся функцией String()
        li.dataset.id = String(id); //string | undefined
        li.innerHTML = `<span>${title} <i>by</i> <b>${getUserName(
        userId
        )}</b></span>`;

        const status = document.createElement('input');
        status.type = 'checkbox';
        status.checked = completed;
        status.addEventListener('change', handleTodoChange);

        const close = document.createElement('span');
        close.innerHTML = '&times;';
        close.className = 'close';
        close.addEventListener('click', handleClose);

        li.prepend(status);
        li.append(close);
        
        // добавим проверку, если todoList есть то добавлеем в него li
        todoList?.prepend(li);
    }

    function createUserOption(user: User) {
        // прежде чем создавать опции провеврим есть ли сам велект
        if (userSelect) {
            const option = document.createElement('option');
            option.value = String(user.id); // получаем число, а TS ждет строку, поэтому явно переводим число в строку через функцию String()а
            option.innerText = user.name;
    
            userSelect.append(option);
        }
    }

    function removeTodo(todoId: ID) {
        // сделаем проверку на наличие списка, если список есть, то сделаем проверку на наличие туду
        if (todoList) {
            todos = todos.filter((todo) => todo.id !== todoId);

            const todo = todoList.querySelector(`[data-id="${todoId}"]`);

            if (todo) {
                todo.querySelector('input')?.removeEventListener('change', handleTodoChange);
                todo.querySelector('.close')?.removeEventListener('click', handleClose);
    
                todo.remove();
            }
        }
    }

    // есть глобальный тип Error
    function alertError(error: Error) {
        alert(error.message);
    }

    // Event Logic
    function initApp() {
        Promise.all([getAllTodos(), getAllUsers()]).then((values) => {
            [todos, users] = values; //не всегда есть возможность работать с глобальными переменными
            // чтобы не было ошибок, в асинхронных функциях нужно явно указать что на выходе будет массив туду или юзеров, 
            // если нет, то вернуть пустой массив

            // Отправить в разметку
            todos.forEach((todo) => printTodo(todo));
            users.forEach((user) => createUserOption(user));
        });
    }
    // для ивента используем глобальный тип Event 
    // он стал доступен в результате подключения 'DOM'
    function handleSubmit(event: Event) {
        event.preventDefault();
        // сделаем проверку, есть ли форма, если есть то достаем из нее значения юсер и туду
        if (form) {
            createTodo({
                userId: Number(form.user.value),
                title: form.todo.value,
                completed: false,
            });
        }
    }


    function handleTodoChange(this: HTMLInputElement) {
        // смотрим выше где применяется эта функция 
        // находим что она вешается на инпут, а значит this будет инпут, глобальный тип его HTMLInputElement
        // также сделаем проверку на наличие родительского элемента parentElement?
        const parent = this.parentElement;
        if (parent) {
            const todoId = parent.dataset.id;
            const completed = this.checked;
            // добавим проверку на наличие todoId
            todoId && toggleTodoComplete(todoId, completed); // если todoId не пустой тогда передаем его как аргумент
        }
    }

    function handleClose(this: HTMLSpanElement) {
        const parent = this.parentElement

        if (parent) {
            const todoId = parent.dataset.id;
            todoId && deleteTodo(todoId);
        }
    }

    // Async logic
    async function getAllTodos(): Promise<Todo[]> {
        try {
        const response = await fetch(
            'https://jsonplaceholder.typicode.com/todos?_limit=15'
        );
        const data = await response.json();

        return data;
        } catch (error) {
            // во всех кетчах делаем проверку на то что тип ошибки является инстансом от глобального тип а ошибки 
            if (error instanceof Error) 
                alertError(error);
            
            return [] // в противном случае возвращаем пустой массив
        }
    }

    async function getAllUsers(): Promise<User[]> {
        try {
        const response = await fetch(
            'https://jsonplaceholder.typicode.com/users?_limit=5'
        );
        const data = await response.json();

        return data;
        } catch (error) {
            if (error instanceof Error) 
                alertError(error);
                
            return [] // в противном случае возвращаем пустой массив
        }
    }

    async function createTodo(todo: Omit<Todo, 'id'>) {
        // в момент создания туду нам ничего неизвестно про id, который есть в интерфейсе, поэтому его нужно здесь исключить Omit<>
        try {
        const response = await fetch(
            'https://jsonplaceholder.typicode.com/todos',
            {
                method: 'POST',
                body: JSON.stringify(todo),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const newTodo = await response.json();

        printTodo(newTodo);
        } catch (error) {
            if (error instanceof Error) {
                alertError(error);
            }    
        }
    }

    async function toggleTodoComplete(todoId: ID, completed: boolean) {
        try {
        const response = await fetch(
            `https://jsonplaceholder.typicode.com/todos/${todoId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ completed }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to connect with the server! Please try later.');
        }
        } catch (error) {
            if (error instanceof Error) {
                alertError(error);
            }
        }
    }

    async function deleteTodo(todoId: ID) {
        try {
        const response = await fetch(
            `https://jsonplaceholder.typicode.com/todos/${todoId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.ok) {
            removeTodo(todoId);
        } else {
            throw new Error('Failed to connect with the server! Please try later.');
        }
        } catch (error) {
            if (error instanceof Error) {
                alertError(error);
            }
        }
    }
})()
