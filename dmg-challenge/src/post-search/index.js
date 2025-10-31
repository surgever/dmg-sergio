/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
import { registerBlockType } from '@wordpress/blocks';

import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import {
	useBlockProps,
	InspectorControls,
	AlignmentControl,
	InnerBlocks,
	BlockControls,
	PanelColorSettings
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	Button,
	Spinner,
	Flex,
} from '@wordpress/components';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * All files containing `style` keyword are bundled together. The code used
 * gets applied both to the front of your site and to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
//import './style.scss';

/**
 * Internal dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import metadata from './block.json';

registerBlockType(metadata.name, {
	edit: ({ attributes, setAttributes }) => {
		const { align, backgroundColor, postId, postTitle, postUrl } = attributes
		const [searchTerm, setSearchTerm] = useState('');
		const [posts, setPosts] = useState([]);
		const [page, setPage] = useState(1);
		const [totalPages, setTotalPages] = useState(1);
		const [loading, setLoading] = useState(false);

		// Fetch posts from WP REST API
		const fetchPosts = async (query = '', currentPage = 1, controller) => {
			setLoading(true);

			try {
				let endpoint = `/wp/v2/posts?per_page=5&page=${currentPage}&_fields=id,title,link`;
				let singlePostMode = false;

				if (query) {
					if (/^\d+$/.test(query)) {
						endpoint = `/wp/v2/posts/${query}?_fields=id,title,link`;
						singlePostMode = true;
					} else {
						endpoint += `&search=${encodeURIComponent(query)}`;
					}
				}

				const response = await apiFetch({
					path: endpoint,
					parse: false,
					signal: controller.signal,
				});

				if (singlePostMode) {
					const data = await response.json();
					setPosts(data?.id ? [data] : []);
					setTotalPages(1);
				} else {
					const total = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
					const data = await response.json();
					setPosts(data);
					setTotalPages(total);
				}
			} catch (error) {
				if (error.name !== 'AbortError') {
					console.error('Post fetch failed:', error);
				}
				setPosts([]);
				setTotalPages(1);
			} finally {
				setLoading(false);
			}
		};

		useEffect(() => {
			const controller = new AbortController(); // Cancel older calls
			const timeout = setTimeout(() => { // Debounced search 
				fetchPosts(searchTerm, page, controller);
			}, 400);

			return () => {
				clearTimeout(timeout);
				controller.abort();
			};
		}, [searchTerm, page]);

		const selectThisPost = (post) => {
			setAttributes({
				postId: post.id,
				postTitle: post.title.rendered,
				postUrl: post.link,
			});
		};

		const blockProps = useBlockProps({ className: 'dmg-read-more' });

		return (
			<>
				<InspectorControls>
					<PanelBody title="Select a Post" initialOpen>
						<TextControl
							label="Search posts"
							value={searchTerm}
							onChange={(val) => {
								setPage(1);
								setSearchTerm(val);
							}}
							placeholder="Search by title or ID"
							style={{ background: '#f6f9fa' }}
						/>

						{loading ? (
							<Spinner />
						) : (
							<>
								{posts.length ? (
									<div className="dmg-post-results">
										{posts.map((post) => (
											<Button
												key={post.id}
												isSecondary
												onClick={() => selectThisPost(post)}
												style={{
													display: 'block',
													marginBottom: '6px',
													textAlign: 'left',
													width: '100%',
													overflow: 'hidden',
												}}
											>
												<span
													dangerouslySetInnerHTML={{
														__html: post.title.rendered || '(No title)',
													}}
												/>
											</Button>
										))}

										<Flex justify="space-between" style={{ marginTop: '12px' }}>
											<Button
												isSmall
												disabled={page <= 1}
												onClick={() => setPage(page - 1)}
											>
												Previous
											</Button>

											<span style={{ fontSize: '80%' }}>
												{page} / {totalPages}
											</span>

											<Button
												isSmall
												disabled={page >= totalPages}
												onClick={() => setPage(page + 1)}
											>
												Next
											</Button>
										</Flex>
									</div>
								) : (
									<p>No posts found.</p>
								)}
							</>
						)}
					</PanelBody>
					<PanelColorSettings 
						title={ __( 'Color settings', 'pindrop-blocks' ) }
						initialOpen={ false }
						colorSettings={ [
							{
							value: backgroundColor,
							onChange: ( newBackgroundColor ) => setAttributes({
								backgroundColor : newBackgroundColor
							}),
							label: __( 'Background color', 'pindrop-blocks' )
							}
						] }
					/>
				</InspectorControls>
				<BlockControls>
					<AlignmentControl
						value={ attributes.align }
						onChange={ ( newAlign ) => setAttributes({ align : newAlign}) }
					/>
				</BlockControls>

				<p {...blockProps}
					style={ { textAlign: align, backgroundColor: backgroundColor } }
					>
					{postUrl ? (
						<>
							Read More:&nbsp;
							<a href={postUrl}>{postTitle || 'Selected Post'}</a>
						</>
					) : (
						<em>No post selected.</em>
					)}
				</p>
			</>
		);
	},

	save: ({ attributes }) => {
		const { align, backgroundColor, postId, postTitle, postUrl } = attributes
		const blockProps = useBlockProps.save({ className: 'dmg-read-more' });

		return (
			<p {...blockProps}
				style={ { textAlign: align, backgroundColor: backgroundColor } }
				>
				Read More:&nbsp;
				<a href={postUrl}>
					{postTitle}
				</a>
			</p>
		);
	},
});