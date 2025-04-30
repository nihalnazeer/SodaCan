from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a08ddfafc1ef'
down_revision: Union[str, None] = '4bf2f35d5f5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # Create all enum types first
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'betstatus') THEN
            CREATE TYPE betstatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'betresult') THEN
            CREATE TYPE betresult AS ENUM ('WON', 'LOST', 'DRAW', 'UNKNOWN');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
            CREATE TYPE role AS ENUM ('SUPERUSER', 'MEMBER');
        END IF;
    END $$;
    """)
    
    # Add columns to bets table
    op.add_column('bets', sa.Column('amount', sa.Integer(), nullable=False))
    op.add_column('bets', sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED', name='betstatus'), nullable=False))
    op.add_column('bets', sa.Column('result', sa.Enum('WON', 'LOST', 'DRAW', 'UNKNOWN', name='betresult'), nullable=False))
    op.add_column('bets', sa.Column('approved_by', sa.Integer(), nullable=True))
    op.add_column('bets', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('bets', sa.Column('mediator_id', sa.Integer(), nullable=False))
    op.add_column('bets', sa.Column('start_time', sa.DateTime(), nullable=True))
    op.add_column('bets', sa.Column('end_time', sa.DateTime(), nullable=False))

    # Create foreign key relationships
    op.create_foreign_key('fk_bets_approved_by', 'bets', 'users', ['approved_by'], ['id'])
    op.create_foreign_key('fk_bets_mediator_id', 'bets', 'users', ['mediator_id'], ['id'])

    # Add role column to room_members
    op.add_column('room_members', 
        sa.Column('role', 
            sa.Enum('SUPERUSER', 'MEMBER', name='role', create_type=False),
            nullable=False,
            server_default='MEMBER'
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the role column from room_members
    op.drop_column('room_members', 'role')

    # Drop foreign key constraints
    op.drop_constraint('fk_bets_approved_by', 'bets', type_='foreignkey')
    op.drop_constraint('fk_bets_mediator_id', 'bets', type_='foreignkey')

    # Drop columns from bets table
    op.drop_column('bets', 'end_time')
    op.drop_column('bets', 'start_time')
    op.drop_column('bets', 'mediator_id')
    op.drop_column('bets', 'created_at')
    op.drop_column('bets', 'approved_by')
    op.drop_column('bets', 'result')
    op.drop_column('bets', 'status')
    op.drop_column('bets', 'amount')

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS betstatus;")
    op.execute("DROP TYPE IF EXISTS betresult;")
    op.execute("DROP TYPE IF EXISTS role;")