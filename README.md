# Zorro-app
Electron SPA with backend on Python with MVVM pattern.

# How?
Implemented custom `data-binding` system, based on websockets (`eel`).

Firstly, `jinja` parse HTML templates, collect bindings and send this to JS. Example of template:
~~~HTML
{% extends 'templates/base/shadow-container.html' %}
{% block content %}
<div id="name" textcontent="{% binding MyViewModel.name OneWayToSource %}" contenteditable="true"></div>
{% endblock %}
~~~
You should define unique `id` for binding's tag, HTML attribute or IDL attribute (`textContent` in example), target property from some ViewModel (`MyViewModel.name` in example) and binding's type (default type is `OneWay`).
If you want use property from `datacontext`, you should write only property's name without ViewModel's name, for example:
~~~HTML
data-attr="{% binding name %}"
~~~

Then, all bindings activated in JS. In short, we add custom events, which calls (through websockets) getters and setters of target properties from Python.

# Compatibility
Now, Zorro-app tested only on `Windows` platform with Python `3.9`, `3.10`.

# Install and Run
1. Clone repo:
~~~shell
git clone --branch=develop https://github.com/sammnnz/zorro-app.git
cd zorro-app
~~~

2. Install Node.js dependencies:
~~~shell
npm install
~~~

3. Create and activate Python virtual environment:
~~~shell
python310 -m venv venv
source venv/Scripts/activate
~~~

4. Install Python dependencies:
~~~shell
python310 -m pip install --upgrade pip
pip install -r requirements.txt
~~~

5. If you need, in `settings.py` change `PORT`.

5. Run `main.py`:
~~~shell
python310 main.py
~~~
