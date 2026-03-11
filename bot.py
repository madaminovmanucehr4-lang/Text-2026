import telebot
import os
import time
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Токен берется из переменных окружения (так безопаснее)
TOKEN = os.environ.get('BOT_TOKEN', '8730673590:AAFS48aINAVsqzE7g2ZW9sg1yIEH0HCNj8c')
WEBAPP_URL = 'https://manu7777.pythonanywhere.com'  # твоя игра на PythonAnywhere

bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start(message):
    # Создаем кнопку с игрой
    keyboard = telebot.types.InlineKeyboardMarkup()
    button = telebot.types.InlineKeyboardButton(
        text="⛏ ИГРАТЬ",
        web_app=telebot.types.WebAppInfo(WEBAPP_URL)
    )
    keyboard.add(button)
    
    bot.send_message(
        message.chat.id,
        "⛏ Добро пожаловать в шахту! Нажми кнопку, чтобы играть.",
        reply_markup=keyboard
    )

@bot.message_handler(func=lambda m: True)
def echo(message):
    bot.reply_to(message, "Отправь /start чтобы играть!")

if __name__ == '__main__':
    print("🚀 Бот запускается...")
    while True:
        try:
            bot.polling(non_stop=True)
        except Exception as e:
            logging.error(f"Ошибка: {e}")
            time.sleep(5)