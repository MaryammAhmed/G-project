"""add user_progress table

Revision ID: a41c7d52b9e0
Revises: e37da1a3d31b
Create Date: 2026-10-21

NOTE ON down_revision: the file you showed (e37da1a3d31b) is the FIRST migration, but your
users table already has email and OTP columns, so you probably have newer migrations too.
Run `alembic heads` and put THAT revision id in down_revision below.
(Easier alternative: delete this file, run
    alembic revision --autogenerate -m "add user_progress"
and check the generated file only contains the create_table below.)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a41c7d52b9e0"
down_revision: Union[str, Sequence[str], None] = "e37da1a3d31b"   # <- replace with the output of `alembic heads`
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("module", sa.Integer(), nullable=False),
        sa.Column("scenario", sa.String(), nullable=False),
        sa.Column("completed", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("best_score", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("last_score", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("last_updated", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "module", name="uq_user_progress_user_module"),
    )
    op.create_index(op.f("ix_user_progress_id"), "user_progress", ["id"], unique=False)
    op.create_index(op.f("ix_user_progress_user_id"), "user_progress", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_progress_user_id"), table_name="user_progress")
    op.drop_index(op.f("ix_user_progress_id"), table_name="user_progress")
    op.drop_table("user_progress")
    