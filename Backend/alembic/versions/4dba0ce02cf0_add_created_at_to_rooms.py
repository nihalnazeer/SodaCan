"""Add created_at to rooms

Revision ID: 4dba0ce02cf0
Revises: 714574309cc3
Create Date: 2025-05-01 00:28:04.605650
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '4dba0ce02cf0'
down_revision = '714574309cc3'
branch_labels = None
depends_on = None


def upgrade():
    # Add created_at column with default value
    op.add_column(
        'rooms',
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=func.now()
        )
    )
    
    # Set created_at for existing records
    op.execute("UPDATE rooms SET created_at = NOW() WHERE created_at IS NULL")


def downgrade():
    # Remove the created_at column
    op.drop_column('rooms', 'created_at')