"""Add constraint for non-null token in private rooms

Revision ID: 714574309cc3
Revises: 1a9b3b0e591b
Create Date: 2025-04-30 23:03:56.044653
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '714574309cc3'
down_revision = '1a9b3b0e591b'
branch_labels = None
depends_on = None


def upgrade():
    # Generate UUID tokens for any existing private rooms with null tokens
    op.execute("""
        UPDATE rooms 
        SET token = gen_random_uuid()::text 
        WHERE is_public = FALSE AND token IS NULL
    """)
    
    # Add check constraint to enforce non-null tokens for private rooms
    op.create_check_constraint(
        "private_room_token_not_null",
        "rooms",
        sa.text("is_public = TRUE OR token IS NOT NULL")
    )

    # Add unique constraint on token column
    op.create_unique_constraint(
        "uq_rooms_token",
        "rooms",
        ["token"]
    )


def downgrade():
    # Remove the constraints
    op.drop_constraint("private_room_token_not_null", "rooms", type_="check")
    op.drop_constraint("uq_rooms_token", "rooms", type_="unique")