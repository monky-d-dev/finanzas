"""Manual order of categories (CAT-09).

- `categories.sort_order`: position among siblings (roots of a kind, or the
  children of a parent). Backfilled with the previous alphabetical order.

Revision ID: 0028
Revises: 0027
Create Date: 2026-11-13
"""

import sqlalchemy as sa

from alembic import op

revision = "0028"
down_revision = "0027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "categories",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="1000000"),
    )
    # Same order the API used until now (name), numbered per sibling group.
    op.execute(
        """
        UPDATE categories c
        SET sort_order = r.pos
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY space_id, kind, parent_id ORDER BY name
                   ) - 1 AS pos
            FROM categories
        ) r
        WHERE c.id = r.id
        """
    )


def downgrade() -> None:
    op.drop_column("categories", "sort_order")
