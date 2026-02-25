const messages = [
  "Внимание! Обнаружена угроза безопасности!",
  "Ваш телефон заражён 17 вирусами!",
  "Система повреждена!",
  "Подозрительная активность обнаружена!",
  "Неизвестное устройство подключено!",
  "Ваша батарея повреждена!",
  "Обнаружена спам-атака!",
  "Ошибка системы 0x00021!",
  "Доступ к данным открыт!",
  "Передача данных..."
];

let openWindows = 0;              // количество активных всплывашек, кроме финального
let stubbornWindowClosed = false;

const errorSound = new Audio("error.mp3");

function shakeScreen() {
  document.body.style.transform = "translateX(5px)";
  setTimeout(() => {
    document.body.style.transform = "translateX(-5px)";
  }, 50);
  setTimeout(() => {
    document.body.style.transform = "translateX(0)";
  }, 100);
}

// order — порядковый номер (0,1,2...) для упора в стек, используется в цикле создания
function createPopup(text, isFinal = false, stubborn = false, order = 0) {
  const popup = document.createElement("div");
  popup.className = "popup";

  // размеры подстраиваются под экран (проценты для телефонов)
  // базовые случайные значения увеличены втрое для заметного роста
  let width = (200 + Math.random() * 250) * 3;
  let height = (120 + Math.random() * 150) * 3;
  // но ни в коем случае не больше доступного пространства
  width = Math.min(width, window.innerWidth * 0.9);
  height = Math.min(height, window.innerHeight * 0.6);

  // габариты итогового окна, чтобы накрыло его остальных
  // итоговое окно тоже увеличено, но будет ограничено размерами экрана
  const finalW = Math.min(window.innerWidth * 0.8, 300 * 3);
  const finalH = Math.min(window.innerHeight * 0.5, 200 * 3);

  if (isFinal) {
    width = finalW;
    height = finalH;
  } else {
    width = Math.max(width, finalW);
    height = Math.max(height, finalH);
  }

  popup.style.width = width + "px";
  popup.style.height = height + "px";

  const baseLeft = (window.innerWidth - width) / 2;
  const baseTop = (window.innerHeight - height) / 2;
  // при малой ширине экрана используем меньший шаг, чтобы стопка не вылезала
  const step = window.innerWidth < 600 ? 4 : 6;
  const offset = order * step;

  // подготовка содержимого
  let content = text;
  if (!isFinal) {
    const fakeTimer = Math.floor(Math.random() * 10) + 5;
    content += `<br><br>Удаление через ${fakeTimer} сек...`;
  }
  if (isFinal) {
    content = `
      🎉 Система успешно очищена! 🎉
      <br><br>
      <button id="prizeBtn">🎁 Жми и получи приз!</button>
    `;
  }

  popup.style.left = baseLeft + offset + "px";
  popup.style.top = baseTop + offset + "px";

  // если это финальное окно, скрываем крестик
  const titleBar = `<div class="titlebar">
      SYSTEM ERROR
      ${isFinal ? "" : "<span class=\"close\">✖</span>"}
    </div>`;

  popup.innerHTML = `
    ${titleBar}
    <div class="content">${content}</div>
  `;

  document.body.appendChild(popup);

  const rect = popup.getBoundingClientRect();
  const actualW = rect.width;
  const actualH = rect.height;
  let finalLeft = (window.innerWidth - actualW) / 2 + offset;
  let finalTop = (window.innerHeight - actualH) / 2 + offset;
  finalLeft = Math.max(finalLeft, 0);
  finalTop = Math.max(finalTop, 0);
  finalLeft = Math.min(finalLeft, window.innerWidth - actualW);
  finalTop = Math.min(finalTop, window.innerHeight - actualH);
  popup.style.left = finalLeft + "px";
  popup.style.top = finalTop + "px";

  if (isFinal) {
    popup.style.zIndex = 1000;
  } else {
    popup.style.zIndex = 1000 + order + 1;
  }

  if (!isFinal) openWindows++;

  // окна больше не перемещаются – остаются на своих местах,
  // чтобы реально лежать друг на друге и не освобождать финальное окно
  // (раньше был хаотичный дрейф, но он мешал задаче).
  // оставляем заглушку переменной на случай дальнейших доработок
  let moveInterval;

  const closeBtn = popup.querySelector(".close");
  if (closeBtn) {
    closeBtn.onclick = () => {
      errorSound.play();
      shakeScreen();

      if (stubborn && !stubbornWindowClosed) {
        popup.querySelector(".content").innerHTML =
          "ЭТО ОКНО НЕЛЬЗЯ ЗАКРЫТЬ 😈";
        stubbornWindowClosed = true;
        return;
      }

      // никаких интервалов больше не запущено
      popup.remove();

      if (!isFinal) {
        openWindows--;
        checkIfDone();
      }
    };
  }

  if (isFinal) {
    popup.querySelector("#prizeBtn").onclick = openVideo;
  }
}

// теперь финальное окно создаётся сразу, поэтому проверка не нужна
// оставляем функцию пустой, чтобы не ломать существующие вызовы
function checkIfDone() {
  // no-op
}

function openVideo() {
  const container = document.getElementById("videoContainer");
  container.classList.remove("hidden");

  // прячем все попапы — даже с высоким z-index
  document.querySelectorAll(".popup").forEach(p => {
    p.style.display = "none";
  });

  // попытка напрямую запустить плеер (на случай, если autoplay блокируется)
  const video = container.querySelector("video");
  if (video) {
    video.currentTime = 0;
    // reload source in case браузер не подхватил
    video.load();
    video.play().catch((e) => {
      console.warn("Autoplay failed, user interaction required", e);
    });
  }
}

// финальное окно создаём сразу; оно будет находиться внизу стопки
createPopup("", true);

// создаём 14 хаотичных окон поверх финального
for (let i = 0; i < 14; i++) {
  const randomText =
    messages[Math.floor(Math.random() * messages.length)];

  if (i === 5) {
    createPopup(randomText, false, true, i); // упрямое окно
  } else {
    createPopup(randomText, false, false, i);
  }
}

