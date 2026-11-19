"""persist OTP attempt and send limits

Revision ID: ab41d5f09c32
Revises: c4b8e2a91d10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ab41d5f09c32"
down_revision: Union[str, Sequence[str], None] = "c4b8e2a91d10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("otp_attempt_window_started_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("otp_locked_until", sa.DateTime(), nullable=True))
    op.add_column(
        "users",
        sa.Column("otp_send_attempts", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column("users", sa.Column("otp_send_window_started_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("otp_last_sent_at", sa.DateTime(), nullable=True))
    op.create_table(
        "otp_source_rate_limits",
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("window_started_at", sa.DateTime(), nullable=False),
        sa.Column("request_count", sa.Integer(), server_default="0", nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )
    op.create_index(
        "ix_otp_source_rate_limits_window_started_at",
        "otp_source_rate_limits",
        ["window_started_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_otp_source_rate_limits_window_started_at", table_name="otp_source_rate_limits")
    op.drop_table("otp_source_rate_limits")
    op.drop_column("users", "otp_last_sent_at")
    op.drop_column("users", "otp_send_window_started_at")
    op.drop_column("users", "otp_send_attempts")
    op.drop_column("users", "otp_locked_until")
    op.drop_column("users", "otp_attempt_window_started_at")
