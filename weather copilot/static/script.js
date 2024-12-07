function sendMessage() {
  const userMessage = document.getElementById("userInput").value.trim();
  if (!userMessage) return;

  addMessage(`You: ${userMessage}`);

  fetch("/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: userMessage }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.reply) {
        addMessage(`Copilot: ${data.reply}`);
      } else {
        addMessage("Copilot: I couldn't understand your query.");
      }
    })
    .catch((error) => {
      addMessage(
        "Copilot: Sorry, an error occurred while processing your request."
      );
      console.error("Error:", error);
    });

  document.getElementById("userInput").value = "";
}

function addMessage(message) {
  const messagesContainer = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.textContent = message;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
