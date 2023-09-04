import openai


class Conversation:
    def __init__(self, system_msg: str):
        self.system_msg = system_msg

        self.messages = [{"role": "system", "content": system_msg}]

    def prompt(self, message: str):
        """
        Prompts chatgpt with the given message

        :param message: The message to send
        :return: The answer
        """

        self.messages.append({"role": "user", "content": message})

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=self.messages,
        )

        self.messages.append(response["choices"][0]["message"])

        return response["choices"][0]["message"]["content"]
