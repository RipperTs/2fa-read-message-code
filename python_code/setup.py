from setuptools import setup

setup(
    app=['main.py'],
    options={
        'py2app': {
            'argv_emulation': True,
            'packages': ['pynput'],  # 如果您的脚本依赖于其他库，可以在此处添加
        }
    },
    setup_requires=['py2app'],
)