"""Create rooms, room_members tables

Revision ID: 32a5240d349d
Revises: 
Create Date: 2025-04-27 00:58:21.966646
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '32a5240d349d'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('rooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('status', sa.Enum('OPEN', 'CLOSED', name='roomstatus'), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('token', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['creator_id'], ['auth.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='public'
    )
    op.create_table('room_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['room_id'], ['public.rooms.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='public'
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('room_members', schema='public')
    op.drop_table('rooms', schema='public')
    op.execute('DROP TYPE IF EXISTS roomstatus')