import json
import logging
import os
from typing import List, Dict

from flask import Flask, render_template, request, jsonify

import openai


def prompt(system_msg: str, messages: List[Dict[str, str]]) -> Dict[str, str]:
    """
    Prompts chatgpt with the given messages

    :param system_msg: The system message
    :param messages: The list of messages and answers to send
    :return: The response
    """

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": system_msg}] + messages,
    )

    return response["choices"][0]["message"]


def main():
    openai.api_key = os.environ.get("OPENAI_KEY")

    with open('modes.json', 'r') as file:
        modes = json.load(file)

    for identifier, mode in modes.items():
        mode["id"] = identifier

    app = Flask(__name__)

    @app.route('/')
    def index():
        return render_template('index.html', modes=modes.values())

    @app.route('/prompt', methods=['POST'])
    def post_prompt():
        mode = request.json.get('mode', '')
        messages = request.json.get('messages', '')

        result = prompt(modes[mode]["system_msg"], messages)
        return jsonify(result)

    app.run(host="0.0.0.0", port=80)


if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] %(levelname)-8s %(name)-12s %(message)s',
    )

    main()
