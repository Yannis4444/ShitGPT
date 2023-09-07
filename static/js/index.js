let chats;
let current_chat_id = null;
let messages = [];
let mode;
let mode_name;
let sending = false;


const {markedHighlight} = globalThis.markedHighlight

const custom_marked = new marked.Marked(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : null;

            if (language) {
                return hljs.highlight(code, {language}).value;
            }
            return hljs.highlightAuto(code).value;
        }
    })
);

function createMessage(text, role) {
    $("#conversation-content").append(
        $('<div class="message ' + role + '">').append(
            custom_marked.parse(text, {sanitize: true})
        )
    );
}

function scrollBottom() {
    let d = $(".conversation");
    d.animate({
        scrollTop: d.prop("scrollHeight")
    }, 1000);
}

function generateUniqueID() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let uniqueID = '';
    for (let i = 0; i < 12; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        uniqueID += characters.charAt(randomIndex);
    }
    return uniqueID;
}

function newChat() {
    if (sending) {
        alert("Can not create chat while still waiting for response");
        return;
    }
    current_chat_id = null;
    $("#conversation-content").html("");
}

function saveCurrentChat() {
    let newChat = false;
    if (!current_chat_id) {
        newChat = true;
        current_chat_id = generateUniqueID();
    }

    let info = {
        id: current_chat_id,
        title: mode_name,
        mode: mode,
        mode_name: mode_name,
        date: new Date().toISOString()
    };

    if (newChat) {
        chats = JSON.parse(localStorage.getItem("chats"));

        if (!chats) {
            chats = [];
        }

        chats.push(info)

        localStorage.setItem("chats", JSON.stringify(chats));
    }

    localStorage.setItem(current_chat_id, JSON.stringify({
        info: info,
        messages: messages
    }));

    addChatToSide(info);
}

function loadChat(id) {
    if (sending) {
        alert("Can not load chat while still waiting for response");
        return;
    }

    let chat = JSON.parse(localStorage.getItem(id));

    if (!chat) {
        alert(`Did not find Chat with ID ${id}`);
        return;
    }

    current_chat_id = chat.info.id;
    mode = chat.info.mode;
    mode_name = chat.info.mode_name;
    messages = chat.messages;

    $("#conversation-content").html("");

    messages.forEach(message => {
        if (message.role === "user" || message.role === "assistant") {
            createMessage(message.content, message.role);
        }
    })

    $("#chat-list .chat.selected").removeClass("selected");
    $("#chat-list .chat[data-chat-id='" + id + "']").addClass("selected");
}

function addChatToSide(chat) {
    $("#chat-list").append(
        $("<div class='chat' data-chat-id='" + chat.id + "'>").append(
            $("<label>").text(chat.title)
        ).on("click", () => {
            loadChat(chat.id);
        })
    );
}

$(document).ready(function () {
    chats = JSON.parse(localStorage.getItem("chats"));

    if (!chats) {
        chats = [];
    }

    chats.forEach(chat => {
        addChatToSide(chat);
    })

    function setUrlParameter(paramName, paramValue) {
        var url = window.location.href;
        var re = new RegExp("([?&])" + paramName + "=.*?(&|$)", "i");
        var separator = url.indexOf('?') !== -1 ? "&" : "?";
        var newUrl;

        if (url.match(re)) {
            newUrl = url.replace(re, '$1' + paramName + "=" + paramValue + '$2');
        } else {
            newUrl = url + separator + paramName + "=" + paramValue;
        }

        history.pushState(null, null, newUrl);
        return newUrl;
    }

    function getUrlParameter(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results == null) {
            return null;
        } else {
            return decodeURIComponent(results[1]) || 0;
        }
    }

    function setMode(m) {
        mode = m;
        $("#conversation-content").html("");
        setUrlParameter("mode", mode);
        var button = $('.modes input[type="radio"][value="' + mode + '"]');
        messages = [{"role": "system", "content": button.data("systemMsg")}];
        button.prop("checked", true);
        mode_name = button.data("modeName");
        // $(".current-model-name").text(mode_name);
        $('head title').text(mode_name);
        $(".sidebar").removeClass("shown");
    }

    function prompt() {
        if (sending) {
            return;
        }

        let input = $("#prompt-input");
        let prompt = input.val();
        input.val('');

        if (prompt === '') {
            return;
        }

        messages.push({"role": "user", "content": prompt});

        createMessage(prompt, "user");

        adjustTextareaHeight();

        scrollBottom();

        $("#conversation-content").addClass("loading");

        sending = true;

        $.ajax({
            url: '/prompt',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                messages: messages
            }),
            success: function (response) {
                sending = false;
                messages.push(response);
                createMessage(response.content, "assistant")
                $("#conversation-content")
                    .removeClass("loading");

                scrollBottom();

                saveCurrentChat();
            },
            error: function (xhr, textStatus, errorThrown) {
                alert(`Error while prompting: ${textStatus} (${xhr.status}) ${errorThrown}`)
            }
        });
    }

    $(".sidebar-toggle").on("click", function () {
        $(".sidebar").toggleClass("shown");
    })

    $('.modes input[type="radio"]').on('change', function () {
        setMode($(this).val());
    });

    function adjustTextareaHeight() {
        // Adjust the height based on the scroll height
        $('#prompt-input').css('height', $('#prompt-input').prop('scrollHeight') + 'px');
    }

    $('#prompt-input').on('input', adjustTextareaHeight); // Adjust height on input

    $('#prompt-input').on('keypress', function (e) {
        if (e.keyCode == 13 && !e.shiftKey) {  // Enter key pressed without Shift
            e.preventDefault();  // Prevent default action (newline)
            prompt();
        }
    });

    $('#send-button').on('click', function () {
        prompt();
    });

    $("#prompt-input").focus();

    // TODO: not from URL
    let m = getUrlParameter("mode");
    if (m === null) {
        m = "shit";
    }
    setMode(m);

    adjustTextareaHeight();
});