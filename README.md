# Data Visualization: Final group project P10, The Price of Dinner

My group keeps its work for the final project of the Data Visualization course in this repository. In this project, my group studies the food prices of wet markets, supermarkets and delivery apps, and compares them with the official consumer price index (CPI). The client is Consumer Lab, a made-up consumer-rights association, and my group answers its big question: where should a student on a tight budget shop?

Team name: not chosen yet.

## Members and branches

Each member works on their own branch.

| Member | Branch |
|---|---|
| Nguyễn Hoàng Minh (leader) | `hwinh` |
| Phạm Quang Minh | `quang-minh` |
| Phạm Tuấn Anh | `tuan-anh` |
| Trần Nhã Đoan | `nha-doan` |
| Nguyễn Minh Nguyệt | `minh-nguyet` |
| Trần Nguyễn Thanh Thảo | `thao` |

## How my group works together

A member never pushes to `dev` or `main` directly. A member pushes to their own branch and then opens a pull request into `dev`. The leader reads the pull request and merges it. When my group is ready to hand in a checkpoint, the leader opens a pull request from `dev` into `main`.

GitHub enforces these rules for us:

- The `main` branch accepts pull requests only from `dev`, and only the repository owner can merge them. Nobody can push to `main` directly, and the owner cannot either.
- The `dev` branch accepts changes only through pull requests. Every member can open one, and only the repository owner can merge it.
- A pull request into `main` from any other branch fails the check named `chi-nhan-tu-dev`. A pull request into `main` that a member opens is also closed automatically.
- Nobody can delete a member branch.

### Steps for a member

First, download the repository and switch to your own branch. The example below uses the branch `thao`.

```bash
git clone https://github.com/hwinhwork-dot/DataViz_Final_P10.git
cd DataViz_Final_P10
git checkout thao
```

Before you start working, pull the newest work from `dev`.

```bash
git pull origin dev
```

When you finish a piece of work, save it and push it to your own branch.

```bash
git add .
git commit -m "Short description of the change"
git push origin thao
```

Last, open GitHub, go to Pull requests, and choose New pull request. Set the base branch to `dev` and the compare branch to your own branch.

## Folders

The folders follow the list of deliverables in the project brief.

```
.
├── notebooks/        01_data to 06_story, and house_style.py (one notebook for each module)
├── data/
│   ├── raw/          the public files, or the scripts that download them; we never edit them
│   └── clean/        the tidy master table and the anonymised primary data
├── evidence/         field sheets, photos, sketches and notes; git ignores them (see the note inside)
├── report/           the report and its appendices
├── slides/           the slides and the poster
└── requirements.txt  The Python packages that we use
```

## Setup

The commands below create a virtual environment and install the packages.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
```
