// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "assets/js/app.js".

// To use Phoenix channels, the first step is to import Socket,
// and connect at the socket path in "lib/web/endpoint.ex".
//
// Pass the token on params as below. Or remove it
// from the params if you are not using authentication.
import {Socket, Presence} from "phoenix"

let socket = new Socket("/socket", {params: {token: window.userToken}})

// When you connect, you'll often need to authenticate the client.
// For example, imagine you have an authentication plug, `MyAuth`,
// which authenticates the session and assigns a `:current_user`.
// If the current user exists you can assign the user's token in
// the connection for use in the layout.
//
// In your "lib/web/router.ex":
//
//     pipeline :browser do
//       ...
//       plug MyAuth
//       plug :put_user_token
//     end
//
//     defp put_user_token(conn, _) do
//       if current_user = conn.assigns[:current_user] do
//         token = Phoenix.Token.sign(conn, "user socket", current_user.id)
//         assign(conn, :user_token, token)
//       else
//         conn
//       end
//     end
//
// Now you need to pass this token to JavaScript. You can do so
// inside a script tag in "lib/web/templates/layout/app.html.eex":
//
//     <script>window.userToken = "<%= assigns[:user_token] %>";</script>
//
// You will need to verify the user token in the "connect/3" function
// in "lib/web/channels/user_socket.ex":
//
//     def connect(%{"token" => token}, socket, _connect_info) do
//       # max_age: 1209600 is equivalent to two weeks in seconds
//       case Phoenix.Token.verify(socket, "user socket", token, max_age: 1209600) do
//         {:ok, user_id} ->
//           {:ok, assign(socket, :user, user_id)}
//         {:error, reason} ->
//           :error
//       end
//     end
//
// Finally, connect to the socket:




// Now that you are connected, you can join channels with a topic:
let roomName = document.querySelector("input#room").value
let roomID = document.querySelector("input#room_id").value
let chatForm = document.querySelector("form#chatForm")
let usernameInput = document.querySelector("input#username")
let messageInput = document.querySelector("input#message")
let messagesOutput = document.querySelector("#message_output")
let usersOutput = document.querySelector("#users_output")

let channel = socket.channel("room:" + roomName, {})
let presence = new Presence(channel)

function renderOnlineUsers(presence) {
  let response = ""
  presence.list((id, {metas: [first, ...rest]}) => {
    let count = rest.length + 1
    if (count == 1) {
      response += `<br>You're the only one here. Maybe you should invite someone?</br>`
    } else if (count > 1) {
      response += `<br>There are ${count} instances connected to this room</br>`
    }
  })

  usersOutput.innerHTML = response
}

if (chatForm) {
  chatForm.addEventListener("submit", event => {
    event.preventDefault()
    if (messageInput.value.length) {
      let username = usernameInput.value || "Guest"
      channel.push(
	"new_message", 
	{room_id: roomID, name: username, body: messageInput.value}
      )
      messageInput.value = ""
    }
  })

  channel.on("new_message", payload => {
    let messageElement = document.createElement("p")
    messageElement.innerHTML = `<strong>${payload.name}</strong>: ${payload.body}`
    messagesOutput.appendChild(messageElement)
    messagesOutput.scrollTop = messagesOutput.scrollHeight
  })
}

socket.connect()

presence.onSync(() => renderOnlineUsers(presence))

channel.join()
  .receive("ok", resp => { console.log("Joined successfully", resp) })
  .receive("error", resp => { console.log("Unable to join", resp) })

export default socket
