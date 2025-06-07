import { useContext, useEffect, useState, useCallback, useRef } from "react"
import { authApis, endpoints } from "../../configs/Apis"
import { View, Text, Image, StyleSheet, Pressable, TouchableOpacity, ImageBackground } from 'react-native'
import Icon from "react-native-vector-icons/Ionicons";
import { MyUserContext } from "../../configs/MyContext";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useParentRoute } from "../utils/RouteProvider";
import { usePendingAction } from "../utils/PendingActionProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

function formatDate(dateString) {
    // Create a Date object from the ISO string
    const date = new Date(dateString);

    // Get day, month, and year
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();

    // Return formatted date string
    return `${day}/${month}/${year}`;
}

const ACTION_TYPES = {
    LIKE_CMT: "like_comment",
    ADD_PRODUCT_CART: "add_product_to_cart"
}

const CommentHeader = ({ totalRating, averageRating }) => {
    return (
        <View style={styles.commentHeaderContainer}>
            <Text>
                <Text style={{ fontSize: 20, fontWeight: 500 }}>{averageRating} </Text>
                <Text>
                    <Icon name="star" size={18} color='#fa5230' />
                </Text>
                <Text style={{ fontSize: 18, fontWeight: 500 }}> Đánh Giá Sản Phẩm ({totalRating})</Text>
            </Text>
            <View style={{ paddingTop: 3, marginRight: 4 }}>
                <TouchableOpacity onPress={() => { console.log("tat ca cmt") }}>
                    <Text style={{ fontSize: 15, color: 'rgba(0,0,0,0.87)' }}>Tất cả {'>'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const RatingStar = ({ rating }) => {
    const starIcons = [];
    for (let i = 0; i < rating; i++) {
        starIcons.push(<Icon key={i} name="star" size={18} color="#fa5230"></Icon>)
    }

    for (let i = 0; i < 5 - rating; i++) {
        starIcons.push(<Icon key={5 - i} name="star-outline" size={18} color="#fa5230"></Icon>)
    }

    return (
        <View style={styles.startIconContainer}>
            {starIcons}
        </View>
    )
}

const CommentCateText = ({ attributes, content }) => {
    let s = "";
    for (let i = 0; i < attributes.length; i++) {
        if (i > 0) {
            s += ", ";
        }
        s += attributes[i].value
    }
    return (
        <View>
            <Text style={{ marginTop: 5 }}>Phân loại: {s}</Text>
            <Text style={{ marginTop: 5 }}>Nội dung: {content} </Text>
        </View>
    )
}

const ImageComemnts = ({ image_list }) => {
    let col = 3
    const images = []
    if (image_list.length > col) {
        for (let i = 0; i < col; i++) {
            if (i == col - 1) {
                images.push(
                    <View style={{ flex: 1 }} key={image_list[i].id}>
                        <ImageBackground style={styles.image} source={{ uri: image_list[i].image }} imageStyle={{ borderRadius: 20 }} resizeMode="cover">
                            <View style={styles.overlay}>

                                <Icon name="image-outline" size={16} color="#fff"></Icon>
                                <Text style={{ fontSize: 13, color: '#fff', textAlign: 'center' }}>+{image_list.length - col}</Text>

                            </View>
                        </ImageBackground>
                    </View>
                )
            }
            else {
                images.push(<Image style={styles.image} key={image_list[i].id} source={{ uri: image_list[i].image }} resizeMode="cover">
                </Image>)
            }
        }

        return (
            <View style={styles.imageCommentContainer}>{images}</View>
        )
    }
    else
        return (
            <View style={styles.imageCommentContainer}>
                {
                    image_list.map(i => (
                        <Image style={styles.image} key={i.id} source={{ uri: i.image }} resizeMode="cover">
                        </Image>
                    ))
                }
            </View>

        )
}

const Comment = ({ comment, activeLike, onPressLike }) => {
    const user = useContext(MyUserContext)
    const navigation = useNavigation();
    const route = useParentRoute();
    const { pendingAction, addPendingAction, resetPendingAction } = usePendingAction()

    // Khi người dùng chưa đăng nhập
    const parentNav = navigation.getParent()
    const nestedScreen = parentNav?.getState()?.routeNames[parentNav?.getState().index];

    const handlePendingLikeCmt = (id) => {
        // navigation.navigate('account', {
        //     screen: 'login', params: {
        //         nestedScreen: nestedScreen, previousRoute: route.name,
        //         prevRouteParams: route.params
        //     }
        // })

        navigation.navigate('account', {
            screen: 'login', params: {
                prevScreen: {
                    nestedScreen: nestedScreen, previousRoute: route.name,
                    prevRouteParams: route.params
                },
                screenAfterLogin: {
                    nestedScreen: nestedScreen,
                    route: route.name,
                    params: route.params
                }
            }
        })

        addPendingAction(ACTION_TYPES.LIKE_CMT, { commentId: id })
    }

    useEffect(() => {
        // handle pending action
        if (pendingAction?.type === ACTION_TYPES.LIKE_CMT) {
            onPressLike(pendingAction.payload.commentId)
            resetPendingAction()
        }
    }, [user])


    return (
        <View style={styles.commentContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: comment.user.avatar }} style={styles.avatar} />
                    <Text style={{ fontSize: 16, marginLeft: 10 }}>{comment.user.username}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {
                        activeLike.includes(comment.id) ? <Text>Hữu ích ({comment.like + 1})</Text> : <Text>Hữu ích ({comment.like})</Text>
                    }
                    <Pressable onPress={() => {
                        user === null ? handlePendingLikeCmt(comment.id) : onPressLike(comment.id)
                    }}>
                        <Icon name='heart' size={20} color={activeLike.includes(comment.id) ? "#fa5230" : "#ccc"}></Icon>
                    </Pressable>
                </View>
            </View>
            <View style={styles.detailComment}>
                <RatingStar rating={comment.rating}></RatingStar>
                <CommentCateText attributes={comment.product_variant.attributes} content={comment.content}></CommentCateText>
                {
                    comment.image_list.length > 0 && (
                        <View>
                            <ImageComemnts image_list={comment.image_list} />
                        </View>
                    )
                }
                <Text style={{ marginTop: 8, color: 'rgba(0,0,0,0.6)' }}>{formatDate(comment.created_date)}</Text>
                {
                    comment.rep_cmt != '' && (
                        <View style={styles.repCmntContainer}>
                            <Text style={{ color: 'rgba(0,0,0,0.87)' }}>Phản hồi của người bán</Text>
                            <Text style={{ margiTop: 5, color: 'rgba(0,0,0,0.87)' }}>{comment.rep_cmt}</Text>
                        </View>
                    )
                }
            </View>
        </View>
    )
}


const CommentProductDetail = ({ commentsInfo }) => {
    let commentsList = { ...commentsInfo }
    const [activeLike, setActiveLike] = useState([])
    const likeRef = useRef(activeLike)

    const toggleLike = (commentId) => {
        activeLike.includes(commentId) ? setActiveLike(activeLike.filter(cId => cId != commentId)) : setActiveLike([...activeLike, commentId])
    }

    const postActiveLike = async () => {
        try {
            if (likeRef.current.length != 0) {
                const token = await AsyncStorage.getItem('token');
                const res = await authApis(token).post(endpoints['updateLikeComment'], {
                    "comments": likeRef.current
                })

                if (res.status == 200) {
                    console.log("update like comment successfully")
                }
            }
        }
        catch (error) {
            console.log("error update like cmt", error)
        }
    }

    useEffect(() => {
        // Keep ref to activeLike
        likeRef.current = activeLike
    }, [activeLike])

    useFocusEffect(
        useCallback(() => {
            return () => {
                postActiveLike()
            };
        }, [])
    )


    return (
        <View>
            <CommentHeader totalRating={commentsList.total_rating} averageRating={commentsList.average_rating} activeLike={activeLike}></CommentHeader>
            <View style={{ marginTop: 5 }}>
                {
                    commentsList.comments.map(c => <Comment key={c.id} comment={c} activeLike={activeLike} onPressLike={toggleLike}></Comment>)
                }
            </View>
        </View>
    )
}

export default CommentProductDetail

const styles = StyleSheet.create({
    container: {
        padding: 8
    },
    commentHeaderContainer: {
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.09)'
    },
    commentContainer: {
        padding: 8,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.09)'
    },
    avatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderColor: 'rgba(0,0,0,0.09)',
        borderWidth: 1
    },
    detailComment: {
        marginTop: 5,
        paddingLeft: 8,
        fontSize: 16,
        color: 'rgba(0,0,0,0.87)'
    },
    startIconContainer: {
        marginLeft: -3,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1
    },
    imageCommentContainer: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 15
    },
    image: {
        width: 110,
        height: 110,
        borderRadius: 20,
        // overflow: 'hidden',

    },
    overlay: {
        position: "absolute",
        bottom: 8,
        right: 8,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    repCmntContainer: {
        marginTop: 8,
        backgroundColor: '#D3D3D3'
    }
})