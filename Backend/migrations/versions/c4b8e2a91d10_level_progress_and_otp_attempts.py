"""level progress and otp attempts

Revision ID: c4b8e2a91d10
Revises: 71010ca0ed32
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4b8e2a91d10"
down_revision: Union[str, Sequence[str], None] = "71010ca0ed32"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("otp_attempts", sa.Integer(), server_default="0", nullable=False))
    op.add_column("user_progress", sa.Column("level", sa.Integer(), server_default="1", nullable=False))
    op.add_column("user_progress", sa.Column("badge", sa.String(), nullable=True))
    op.drop_constraint("uq_user_progress_user_module", "user_progress", type_="unique")
    op.create_unique_constraint(
        "uq_user_progress_user_module_level",
        "user_progress",
        ["user_id", "module", "level"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_user_progress_user_module_level", "user_progress", type_="unique")
    op.create_unique_constraint("uq_user_progress_user_module", "user_progress", ["user_id", "module"])
    op.drop_column("user_progress", "badge")
    op.drop_column("user_progress", "level")
    op.drop_column("users", "otp_attempts")
