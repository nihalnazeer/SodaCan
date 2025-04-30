"""Add notifications table

Revision ID: 1a9b3b0e591b
Revises: a08ddfafc1ef
Create Date: 2025-04-30 09:40:44.894175

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1a9b3b0e591b'
down_revision: Union[str, None] = 'a08ddfafc1ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('bet_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bet_id'], ['bets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create enum type for notification types
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationtype') THEN
            CREATE TYPE notificationtype AS ENUM (
                'bet_result',
                'message',
                'system'
            );
        END IF;
    END $$;
    """)

    # Convert the type column to use the enum
    op.alter_column('notifications', 'type',
                   type_=sa.Enum('bet_result', 'message', 'system', name='notificationtype'),
                   postgresql_using='type::notificationtype')


def downgrade() -> None:
    """Downgrade schema."""
    # Drop notifications table and enum type
    op.drop_table('notifications')
    op.execute("DROP TYPE IF EXISTS notificationtype")