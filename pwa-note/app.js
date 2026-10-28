'use strict';
const squareButton = document.getElementById('square');
const result = document.getElementById('result');
let wasmExports;
fetch('./function.wasm').then(response => {
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.arrayBuffer();
}).then(bytes => WebAssembly.instantiate(bytes)).then(({instance}) => {
  wasmExports = instance.exports;
  squareButton.disabled = false;
  result.textContent = 'Модуль готов';
}).catch(() => { result.textContent = 'Модуль недоступен. Откройте приложение с сетью для первого запуска.'; });
squareButton.addEventListener('click', () => {
  const input = document.getElementById('number');
  if (!input.reportValidity() || input.value === '') return;
  const n = Number(input.value);
  if (!Number.isInteger(n) || Math.abs(n) > 46340) return;
  result.textContent = `${n}² = ${wasmExports.square(n)}`;
});

let socket;
const send = document.getElementById('send');
const connect = document.getElementById('connect');
const connection = document.getElementById('connection');
function log(text) {
  const item = document.createElement('li');
  item.textContent = text;
  const list = document.getElementById('messages');
  list.append(item);
  if (list.children.length > 50) list.firstElementChild.remove();
}
connect.addEventListener('click', () => {
  if (!navigator.onLine) { connection.textContent = 'Нет сети. Заметка и вычисления доступны.'; return; }
  if (socket && socket.readyState < WebSocket.CLOSING) return;
  socket = new WebSocket('wss://echo.websocket.org');
  const current = socket;
  connect.disabled = true;
  connection.textContent = 'Подключение…';
  const timeout = setTimeout(() => {
    if (current.readyState === WebSocket.CONNECTING) current.close();
  }, 15000);
  current.addEventListener('open', () => {
    clearTimeout(timeout); send.disabled = false;
    connection.textContent = 'Соединение открыто';
  });
  current.addEventListener('message', event => log('Эхо: ' + event.data));
  current.addEventListener('close', () => {
    clearTimeout(timeout); send.disabled = true; connect.disabled = false;
    connection.textContent = navigator.onLine ? 'Соединение закрыто. Можно подключиться снова.' : 'Нет сети. Заметка и вычисления доступны.';
  });
  current.addEventListener('error', () => { connection.textContent = 'Не удалось связаться с эхо-сервером.'; });
});
document.getElementById('chat').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.getElementById('message');
  if (!input.value.trim()) return;
  if (!socket || socket.readyState !== WebSocket.OPEN) { connection.textContent = 'Сначала подключитесь к серверу.'; return; }
  socket.send(input.value); log('Вы: ' + input.value); input.value = '';
});
window.addEventListener('offline', () => {
  send.disabled = true;
  connection.textContent = 'Нет сети. Заметка и вычисления доступны.';
  if (socket) socket.close();
});
