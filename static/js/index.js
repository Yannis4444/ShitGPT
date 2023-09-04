let messages = [];
let mode;
let sending = false;

$(document).ready(function () {
    $('#prompt-input').on('keypress', function (e) {
        if (e.which == 13) {  // Enter key pressed

        }
    });
});

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

function create_message(text, role) {
    return $('<div class="message ' + role + '">').append(
        custom_marked.parse(text, {sanitize: true})
    );
}

function scrollBottom() {
    let d = $(".conversation");
    d.animate({
        scrollTop: d.prop("scrollHeight")
    }, 1000);
}

$(document).ready(function () {

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
        messages = [];
        $("#conversation-content").html("");
        setUrlParameter("mode", mode);
        var button = $('.modes input[type="radio"][value="' + mode + '"]');
        button.prop("checked", true);
        $(".current-model-name").text(button.data("modeName"));
        $('head title').text(button.data("modeName"));
        $(".mode-selector").removeClass("shown");
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

        $("#conversation-content").append(
            create_message(prompt, "user")
        );

        adjustTextareaHeight();

        scrollBottom();

        $("#conversation-content").addClass("loading");

        sending = true;

        $.ajax({
            url: '/prompt',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                mode: mode,
                messages: messages
            }),
            success: function (response) {
                sending = false;
                messages.push(response);
                $("#conversation-content")
                    .append(
                        create_message(response.content, "gpt")
                    )
                    .removeClass("loading");

                scrollBottom();
            }
        });
    }

    $(".mode-selector-toggle").on("click", function () {
        $(".mode-selector").toggleClass("shown");
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

    mode = getUrlParameter("mode");
    if (mode === null) {
        mode = "shit";
    }
    setMode(mode);

    adjustTextareaHeight();
});