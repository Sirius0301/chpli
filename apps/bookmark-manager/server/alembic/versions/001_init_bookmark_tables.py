"""init bookmark tables

Revision ID: 001
Revises: 
Create Date: 2026-04-21 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'bm_bookmarks',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('url', sa.String(length=2048), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('click_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_clicked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_required', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dismissed_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bm_bookmarks_user_id', 'bm_bookmarks', ['user_id'])
    op.create_index('ix_bm_bookmarks_is_deleted', 'bm_bookmarks', ['is_deleted'])
    op.create_index('ix_bm_bookmarks_is_required', 'bm_bookmarks', ['is_required'])

    op.create_table(
        'bm_tags',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_tags_user_name')
    )
    op.create_index('ix_bm_tags_user_id', 'bm_tags', ['user_id'])

    op.create_table(
        'bm_bookmark_tags',
        sa.Column('bookmark_id', sa.UUID(), nullable=False),
        sa.Column('tag_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['bookmark_id'], ['bm_bookmarks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['bm_tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('bookmark_id', 'tag_id'),
    )

    op.create_table(
        'bm_click_logs',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('bookmark_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('clicked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['bookmark_id'], ['bm_bookmarks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bm_click_logs_bookmark_id', 'bm_click_logs', ['bookmark_id'])
    op.create_index('ix_bm_click_logs_user_id', 'bm_click_logs', ['user_id'])


def downgrade() -> None:
    op.drop_table('bm_click_logs')
    op.drop_table('bm_bookmark_tags')
    op.drop_table('bm_tags')
    op.drop_table('bm_bookmarks')
